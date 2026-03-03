-- LoveX Verification System Migration
-- Run this script to add verification tables to existing database

-- ===================================
-- PROFILE VERIFICATION SYSTEM
-- ===================================

-- Verification attempts tracking
CREATE TABLE IF NOT EXISTS public.verification_attempts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  attempt_number INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  selfie_urls TEXT[] DEFAULT '{}',
  pose_types TEXT[] DEFAULT '{}',
  confidence_scores FLOAT[],
  rejection_reason TEXT,
  ip_address TEXT,
  user_agent TEXT,
  device_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Verified users
CREATE TABLE IF NOT EXISTS public.verified_users (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  verification_id UUID REFERENCES public.verification_attempts(id),
  verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  verification_level TEXT CHECK (verification_level IN ('basic', 'premium', 'golden')),
  badge_type TEXT DEFAULT 'verified',
  verification_metadata JSONB,
  UNIQUE(user_id)
);

-- Verification poses configuration
CREATE TABLE IF NOT EXISTS public.verification_poses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pose_key TEXT UNIQUE NOT NULL,
  instruction TEXT NOT NULL,
  icon TEXT NOT NULL,
  duration_seconds INTEGER DEFAULT 3,
  guide_image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verification analytics
CREATE TABLE IF NOT EXISTS public.verification_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE NOT NULL,
  total_attempts INTEGER DEFAULT 0,
  successful_verifications INTEGER DEFAULT 0,
  failed_verifications INTEGER DEFAULT 0,
  average_confidence FLOAT,
  rejection_reasons JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date)
);

-- Update profiles table to include verification status (only if columns don't exist)
DO $$
BEGIN
  -- Add verification_badge column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'verification_badge'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN verification_badge TEXT CHECK (verification_badge IN ('basic', 'premium', 'golden'));
  END IF;

  -- Add verified_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'verified_at'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN verified_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Indexes for verification tables
CREATE INDEX IF NOT EXISTS idx_verification_attempts_user ON public.verification_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_attempts_status ON public.verification_attempts(status);
CREATE INDEX IF NOT EXISTS idx_verification_attempts_created ON public.verification_attempts(created_at);
CREATE INDEX IF NOT EXISTS idx_verified_users_level ON public.verified_users(verification_level);
CREATE INDEX IF NOT EXISTS idx_verified_users_expires ON public.verified_users(expires_at);
CREATE INDEX IF NOT EXISTS idx_verification_poses_active ON public.verification_poses(is_active);
CREATE INDEX IF NOT EXISTS idx_verification_analytics_date ON public.verification_analytics(date);

-- RLS for verification tables
ALTER TABLE IF EXISTS public.verification_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.verified_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.verification_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for verification
DROP POLICY IF EXISTS "Users can view their own verification attempts" ON public.verification_attempts;
CREATE POLICY "Users can view their own verification attempts" ON public.verification_attempts FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own verification attempts" ON public.verification_attempts;
CREATE POLICY "Users can insert their own verification attempts" ON public.verification_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own verification status" ON public.verified_users;
CREATE POLICY "Users can view their own verification status" ON public.verified_users FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can update verification status" ON public.verified_users;
CREATE POLICY "System can update verification status" ON public.verified_users FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Admins can view verification analytics" ON public.verification_analytics;
CREATE POLICY "Admins can view verification analytics" ON public.verification_analytics FOR SELECT USING (EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid() AND vip_tier IN ('platinum', 'diamond')
));

-- Verification functions

-- Function to check if user can attempt verification
CREATE OR REPLACE FUNCTION public.can_attempt_verification(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  recent_attempts INTEGER;
  max_attempts INTEGER := 3;
  cooldown_hours INTEGER := 24;
BEGIN
  -- Count rejected attempts in last 24 hours
  SELECT COUNT(*) INTO recent_attempts
  FROM public.verification_attempts
  WHERE user_id = user_uuid
    AND status = 'rejected'
    AND created_at > NOW() - INTERVAL '1 hour' * cooldown_hours;
  
  RETURN recent_attempts < max_attempts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get verification status with badge info
CREATE OR REPLACE FUNCTION public.get_verification_status(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'status', COALESCE(va.status, 'unverified'),
    'is_verified', COALESCE(vu.user_id IS NOT NULL, false),
    'badge_type', vu.verification_level,
    'verified_at', vu.verified_at,
    'expires_at', vu.expires_at,
    'pending_attempt', va.id IS NOT NULL,
    'attempt_count', (SELECT COUNT(*) FROM public.verification_attempts WHERE user_id = user_uuid)
  ) INTO result
  FROM public.profiles p
  LEFT JOIN public.verified_users vu ON p.id = vu.user_id
  LEFT JOIN public.verification_attempts va ON p.id = va.user_id AND va.status = 'pending'
  WHERE p.id = user_uuid;
  
  RETURN COALESCE(result, '{"status": "unverified", "is_verified": false, "pending_attempt": false, "attempt_count": 0}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update profile verification status
CREATE OR REPLACE FUNCTION public.update_profile_verification(user_uuid UUID, badge_level TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET 
    is_verified = true,
    verification_badge = badge_level,
    verified_at = NOW()
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to revoke verification
CREATE OR REPLACE FUNCTION public.revoke_verification(user_uuid UUID, reason TEXT DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
  -- Remove verified status
  UPDATE public.profiles
  SET 
    is_verified = false,
    verification_badge = NULL,
    verified_at = NULL
  WHERE id = user_uuid;
  
  -- Mark verification as expired
  UPDATE public.verified_users
  SET expires_at = NOW()
  WHERE user_id = user_uuid;
  
  -- Log revocation
  INSERT INTO public.verification_attempts (user_id, status, rejection_reason)
  VALUES (user_uuid, 'expired', COALESCE(reason, 'Verification revoked'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update verification analytics
CREATE OR REPLACE FUNCTION public.update_verification_analytics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.verification_analytics (date, total_attempts, successful_verifications, failed_verifications)
  VALUES (
    CURRENT_DATE,
    1,
    CASE WHEN NEW.status = 'approved' THEN 1 ELSE 0 END,
    CASE WHEN NEW.status = 'rejected' THEN 1 ELSE 0 END
  )
  ON CONFLICT (date) DO UPDATE SET
    total_attempts = verification_analytics.total_attempts + 1,
    successful_verifications = verification_analytics.successful_verifications + 
      CASE WHEN NEW.status = 'approved' THEN 1 ELSE 0 END,
    failed_verifications = verification_analytics.failed_verifications + 
      CASE WHEN NEW.status = 'rejected' THEN 1 ELSE 0 END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply analytics trigger
DROP TRIGGER IF EXISTS update_verification_analytics_trigger ON public.verification_attempts;
CREATE TRIGGER update_verification_analytics_trigger
  AFTER INSERT OR UPDATE ON public.verification_attempts
  FOR EACH ROW EXECUTE FUNCTION public.update_verification_analytics();

-- Insert default verification poses
INSERT INTO public.verification_poses (pose_key, instruction, icon, duration_seconds, sort_order) VALUES
  ('neutral', 'Look straight at the camera', '👤', 3, 1),
  ('left', 'Turn your head slowly to the left', '👈', 3, 2),
  ('right', 'Turn your head slowly to the right', '👉', 3, 3),
  ('smile', 'Give us a natural smile', '😊', 2, 4),
  ('wink', 'Give a little wink', '😉', 2, 5)
ON CONFLICT (pose_key) DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'LoveX Verification System migration completed successfully!';
  RAISE NOTICE 'Tables created: verification_attempts, verified_users, verification_poses, verification_analytics';
  RAISE NOTICE 'Functions created: can_attempt_verification, get_verification_status, update_profile_verification, revoke_verification';
  RAISE NOTICE 'Indexes and RLS policies applied';
  RAISE NOTICE 'Default poses inserted';
END $$;
