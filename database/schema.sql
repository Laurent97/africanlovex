-- LoveX Database Schema
-- East Africa's Premier Romance & Live Gifting Platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  age INTEGER CHECK (age >= 18 AND age <= 100),
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  country TEXT NOT NULL,
  city TEXT,
  tribe TEXT,
  languages TEXT[],
  interests TEXT[],
  relationship_intention TEXT CHECK (relationship_intention IN ('looking_for_love', 'serious_only', 'friends_first', 'sugar_daddy', 'sugar_mommy')),
  verification_level TEXT DEFAULT 'basic' CHECK (verification_level IN ('basic', 'standard', 'premium')),
  is_verified BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  vip_tier TEXT DEFAULT 'free' CHECK (vip_tier IN ('free', 'basic', 'premium', 'platinum', 'diamond')),
  coins_balance BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matches table
CREATE TABLE public.matches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'rejected', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

-- Messages table
CREATE TABLE public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'voice', 'gift')),
  gift_id UUID REFERENCES public.gifts(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gifts table
CREATE TABLE public.gifts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  name_local TEXT NOT NULL, -- Local language name
  description TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('everyday', 'romantic', 'serious', 'legendary', 'real_world')),
  cost_coins INTEGER NOT NULL CHECK (cost_coins > 0),
  animation_url TEXT,
  icon_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sent gifts tracking
CREATE TABLE public.sent_gifts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  from_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  gift_id UUID REFERENCES public.gifts(id) ON DELETE CASCADE,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Live streaming rooms
CREATE TABLE public.live_rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  host_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  room_type TEXT DEFAULT 'public' CHECK (room_type IN ('public', 'private', 'speed_dating')),
  is_active BOOLEAN DEFAULT true,
  viewer_count INTEGER DEFAULT 0,
  max_viewers INTEGER DEFAULT 100,
  cost_per_minute INTEGER, -- Cost in coins per minute for private rooms
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE public.subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('basic', 'premium', 'platinum', 'diamond')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coin transactions
CREATE TABLE public.coin_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL, -- Positive for credits, negative for debits
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'gift_sent', 'gift_received', 'withdrawal', 'bonus')),
  description TEXT NOT NULL,
  reference_id UUID, -- Reference to related record (gift_id, subscription_id, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_profiles_country ON public.profiles(country);
CREATE INDEX idx_profiles_city ON public.profiles(city);
CREATE INDEX idx_profiles_age ON public.profiles(age);
CREATE INDEX idx_profiles_gender ON public.profiles(gender);
CREATE INDEX idx_profiles_vip_tier ON public.profiles(vip_tier);
CREATE INDEX idx_matches_user1 ON public.matches(user1_id);
CREATE INDEX idx_matches_user2 ON public.matches(user2_id);
CREATE INDEX idx_matches_status ON public.matches(status);
CREATE INDEX idx_messages_match ON public.messages(match_id);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_gifts_tier ON public.gifts(tier);
CREATE INDEX idx_gifts_active ON public.gifts(is_active);
CREATE INDEX idx_live_rooms_host ON public.live_rooms(host_id);
CREATE INDEX idx_live_rooms_active ON public.live_rooms(is_active);
CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_coin_transactions_user ON public.coin_transactions(user_id);
CREATE INDEX idx_coin_transactions_type ON public.coin_transactions(transaction_type);

-- Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sent_gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: Users can view all profiles but only update their own
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Matches: Users can view matches they're involved in
CREATE POLICY "Users can view their matches" ON public.matches FOR SELECT USING (user1_id = auth.uid() OR user2_id = auth.uid());
CREATE POLICY "Users can create matches" ON public.matches FOR INSERT WITH CHECK (user1_id = auth.uid() OR user2_id = auth.uid());

-- Messages: Users can view messages in their matches
CREATE POLICY "Users can view messages in their matches" ON public.messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.matches 
    WHERE id = match_id 
    AND (user1_id = auth.uid() OR user2_id = auth.uid())
  )
);
CREATE POLICY "Users can send messages in their matches" ON public.messages FOR INSERT WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.matches 
    WHERE id = match_id 
    AND status = 'matched'
    AND (user1_id = auth.uid() OR user2_id = auth.uid())
  )
);

-- Gifts: Everyone can view active gifts
CREATE POLICY "Active gifts are viewable by everyone" ON public.gifts FOR SELECT USING (is_active = true);

-- Sent gifts: Users can view gifts they sent or received
CREATE POLICY "Users can view their sent/received gifts" ON public.sent_gifts FOR SELECT 
USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

-- Live rooms: Everyone can view active rooms, hosts can manage their rooms
CREATE POLICY "Active rooms are viewable by everyone" ON public.live_rooms FOR SELECT USING (is_active = true);
CREATE POLICY "Hosts can manage their rooms" ON public.live_rooms FOR ALL USING (host_id = auth.uid());

-- Subscriptions: Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT USING (user_id = auth.uid());

-- Coin transactions: Users can view their own transactions
CREATE POLICY "Users can view own transactions" ON public.coin_transactions FOR SELECT USING (user_id = auth.uid());

-- Functions and triggers

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER handle_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_matches_updated_at BEFORE UPDATE ON public.matches FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_messages_updated_at BEFORE UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_gifts_updated_at BEFORE UPDATE ON public.gifts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_live_rooms_updated_at BEFORE UPDATE ON public.live_rooms FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, country)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'country', 'RW')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update coins balance
CREATE OR REPLACE FUNCTION public.update_coins_balance(user_uuid UUID, amount_change BIGINT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles 
  SET coins_balance = coins_balance + amount_change
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if users can match
CREATE OR REPLACE FUNCTION public.can_match(user1_uuid UUID, user2_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if users already have a match
  IF EXISTS (
    SELECT 1 FROM public.matches 
    WHERE ((user1_id = user1_uuid AND user2_id = user2_uuid) 
           OR (user1_id = user2_uuid AND user2_id = user1_uuid))
    AND status IN ('pending', 'matched')
  ) THEN
    RETURN FALSE;
  END IF;
  
  -- Check if users are the same person
  IF user1_uuid = user2_uuid THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================
-- PROFILE VERIFICATION SYSTEM
-- ===================================

-- Verification attempts tracking
CREATE TABLE public.verification_attempts (
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
CREATE TABLE public.verified_users (
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
CREATE TABLE public.verification_poses (
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

-- Update profiles table to include verification status
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS verification_badge TEXT CHECK (verification_badge IN ('basic', 'premium', 'golden')),
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;

-- Verification analytics
CREATE TABLE public.verification_analytics (
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

-- Indexes for verification tables
CREATE INDEX idx_verification_attempts_user ON public.verification_attempts(user_id);
CREATE INDEX idx_verification_attempts_status ON public.verification_attempts(status);
CREATE INDEX idx_verification_attempts_created ON public.verification_attempts(created_at);
CREATE INDEX idx_verified_users_level ON public.verified_users(verification_level);
CREATE INDEX idx_verified_users_expires ON public.verified_users(expires_at);
CREATE INDEX idx_verification_poses_active ON public.verification_poses(is_active);
CREATE INDEX idx_verification_analytics_date ON public.verification_analytics(date);

-- RLS for verification tables
ALTER TABLE public.verification_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verified_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for verification
CREATE POLICY "Users can view their own verification attempts" ON public.verification_attempts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own verification attempts" ON public.verification_attempts FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own verification status" ON public.verified_users FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can update verification status" ON public.verified_users FOR UPDATE USING (true);

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
  
  RETURN COALESCE(result, '{}'::jsonb);
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
