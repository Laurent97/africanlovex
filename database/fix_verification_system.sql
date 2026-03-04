-- Complete Verification System Fix
-- Run this script to fix all verification system issues

-- Step 1: Ensure all verification tables exist with proper structure
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

-- Step 2: Add verification columns to profiles table if they don't exist
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

  -- Add is_verified column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN is_verified BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Step 3: Create indexes
CREATE INDEX IF NOT EXISTS idx_verification_attempts_user ON public.verification_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_attempts_status ON public.verification_attempts(status);
CREATE INDEX IF NOT EXISTS idx_verification_attempts_created ON public.verification_attempts(created_at);
CREATE INDEX IF NOT EXISTS idx_verified_users_level ON public.verified_users(verification_level);
CREATE INDEX IF NOT EXISTS idx_verified_users_expires ON public.verified_users(expires_at);
CREATE INDEX IF NOT EXISTS idx_verification_poses_active ON public.verification_poses(is_active);

-- Step 4: Enable RLS
ALTER TABLE IF EXISTS public.verification_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.verified_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.verification_poses ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies
DROP POLICY IF EXISTS "Users can view their own verification attempts" ON public.verification_attempts;
CREATE POLICY "Users can view their own verification attempts" ON public.verification_attempts FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own verification attempts" ON public.verification_attempts;
CREATE POLICY "Users can insert their own verification attempts" ON public.verification_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own verification status" ON public.verified_users;
CREATE POLICY "Users can view their own verification status" ON public.verified_users FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can update verification status" ON public.verified_users;
CREATE POLICY "System can update verification status" ON public.verified_users FOR UPDATE USING (true);

-- Step 6: Create verification functions
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

-- Step 7: Insert default verification poses
INSERT INTO public.verification_poses (pose_key, instruction, icon, duration_seconds, sort_order) VALUES
  ('neutral', 'Look straight at the camera', '👤', 3, 1),
  ('left', 'Turn your head slowly to the left', '👈', 3, 2),
  ('right', 'Turn your head slowly to the right', '👉', 3, 3),
  ('smile', 'Give us a natural smile', '😊', 2, 4),
  ('wink', 'Give a little wink', '😉', 2, 5)
ON CONFLICT (pose_key) DO NOTHING;

-- Step 8: Grant permissions
GRANT SELECT, INSERT ON public.verification_attempts TO authenticated;
GRANT SELECT ON public.verified_users TO authenticated;
GRANT SELECT ON public.verification_poses TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_attempt_verification TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_verification_status TO authenticated;

COMMIT;
