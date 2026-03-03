-- LoveX Complete Database Setup
-- East Africa's Premier Romance & Live Gifting Platform
-- This script creates all tables, triggers, policies, and initial data

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types for enums
DO $$ BEGIN
    CREATE TYPE verification_level AS ENUM ('basic', 'standard', 'premium');
    CREATE TYPE vip_tier AS ENUM ('free', 'basic', 'premium', 'platinum', 'diamond');
    CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');
    CREATE TYPE relationship_intention AS ENUM ('looking_for_love', 'serious_only', 'friends_first', 'sugar_daddy', 'sugar_mommy');
    CREATE TYPE match_status AS ENUM ('pending', 'matched', 'rejected', 'expired');
    CREATE TYPE message_type AS ENUM ('text', 'image', 'voice', 'gift');
    CREATE TYPE gift_tier AS ENUM ('everyday', 'romantic', 'serious', 'legendary', 'real_world');
    CREATE TYPE room_type AS ENUM ('public', 'private', 'speed_dating');
    CREATE TYPE subscription_tier AS ENUM ('basic', 'premium', 'platinum', 'diamond');
    CREATE TYPE transaction_type AS ENUM ('purchase', 'gift_sent', 'gift_received', 'withdrawal', 'bonus');
    CREATE TYPE report_category AS ENUM ('fake_profile', 'inappropriate_content', 'scam', 'harassment', 'underage', 'other');
    CREATE TYPE report_status AS ENUM ('pending', 'reviewing', 'resolved', 'dismissed');
    CREATE TYPE moderation_action AS ENUM ('warn', 'suspend', 'ban', 'clear');
    CREATE TYPE alert_type AS ENUM ('scam_attempt', 'inappropriate_content', 'suspicious_activity');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    age INTEGER CHECK (age >= 18 AND age <= 100),
    gender gender_type,
    country TEXT NOT NULL,
    city TEXT,
    tribe TEXT,
    languages TEXT[],
    interests TEXT[],
    relationship_intention relationship_intention,
    verification_level verification_level DEFAULT 'basic',
    is_verified BOOLEAN DEFAULT false,
    is_premium BOOLEAN DEFAULT false,
    vip_tier vip_tier DEFAULT 'free',
    coins_balance BIGINT DEFAULT 0,
    is_suspended BOOLEAN DEFAULT false,
    suspension_ends_at TIMESTAMP WITH TIME ZONE,
    suspension_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gifts table (MUST come before messages and sent_gifts)
CREATE TABLE IF NOT EXISTS public.gifts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    name_local TEXT NOT NULL,
    description TEXT NOT NULL,
    tier gift_tier NOT NULL,
    cost_coins INTEGER NOT NULL CHECK (cost_coins > 0),
    animation_url TEXT,
    icon_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matches table
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    user2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status match_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user1_id, user2_id)
);

-- Messages table (now can reference gifts table)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type message_type DEFAULT 'text',
    gift_id UUID REFERENCES public.gifts(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sent gifts tracking (now can reference gifts table)
CREATE TABLE IF NOT EXISTS public.sent_gifts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    from_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    to_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    gift_id UUID REFERENCES public.gifts(id) ON DELETE CASCADE,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Live streaming rooms
CREATE TABLE IF NOT EXISTS public.live_rooms (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    host_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    room_type room_type DEFAULT 'public',
    is_active BOOLEAN DEFAULT true,
    viewer_count INTEGER DEFAULT 0,
    max_viewers INTEGER DEFAULT 100,
    cost_per_minute INTEGER,
    thumbnail_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    tier subscription_tier NOT NULL,
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
CREATE TABLE IF NOT EXISTS public.coin_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount BIGINT NOT NULL,
    transaction_type transaction_type NOT NULL,
    description TEXT NOT NULL,
    reference_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blocked users
CREATE TABLE IF NOT EXISTS public.blocked_users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    blocker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    blocked_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profile reports
CREATE TABLE IF NOT EXISTS public.profile_reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    category report_category NOT NULL,
    description TEXT,
    evidence TEXT[],
    status report_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Moderation actions
CREATE TABLE IF NOT EXISTS public.moderation_actions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    report_id UUID REFERENCES public.profile_reports(id) ON DELETE CASCADE,
    action moderation_action NOT NULL,
    moderator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    notes TEXT,
    duration_days INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Phone history for SIM swap detection
CREATE TABLE IF NOT EXISTS public.phone_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL,
    country TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Safety alerts
CREATE TABLE IF NOT EXISTS public.safety_alerts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    alert_type alert_type NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Swipe history for matching algorithm
CREATE TABLE IF NOT EXISTS public.swipe_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('like', 'pass')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily recommendations
CREATE TABLE IF NOT EXISTS public.daily_recommendations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    recommended_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    score INTEGER,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment transactions
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL,
    payment_method_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    transaction_id TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    description TEXT NOT NULL,
    reference_id UUID,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Room participants (for live streaming)
CREATE TABLE IF NOT EXISTS public.room_participants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    room_id UUID REFERENCES public.live_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_host BOOLEAN DEFAULT false,
    is_muted BOOLEAN DEFAULT false,
    is_video_enabled BOOLEAN DEFAULT true,
    left_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_country ON public.profiles(country);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles(city);
CREATE INDEX IF NOT EXISTS idx_profiles_age ON public.profiles(age);
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON public.profiles(gender);
CREATE INDEX IF NOT EXISTS idx_profiles_vip_tier ON public.profiles(vip_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_verification_level ON public.profiles(verification_level);
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified ON public.profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);

CREATE INDEX IF NOT EXISTS idx_matches_user1 ON public.matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2 ON public.matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_created_at ON public.matches(created_at);

CREATE INDEX IF NOT EXISTS idx_messages_match ON public.messages(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

CREATE INDEX IF NOT EXISTS idx_gifts_tier ON public.gifts(tier);
CREATE INDEX IF NOT EXISTS idx_gifts_cost ON public.gifts(cost_coins);
CREATE INDEX IF NOT EXISTS idx_gifts_active ON public.gifts(is_active);
CREATE INDEX IF NOT EXISTS idx_gifts_created_at ON public.gifts(created_at);

CREATE INDEX IF NOT EXISTS idx_sent_gifts_from ON public.sent_gifts(from_user_id);
CREATE INDEX IF NOT EXISTS idx_sent_gifts_to ON public.sent_gifts(to_user_id);
CREATE INDEX IF NOT EXISTS idx_sent_gifts_created_at ON public.sent_gifts(created_at);

CREATE INDEX IF NOT EXISTS idx_live_rooms_host ON public.live_rooms(host_id);
CREATE INDEX IF NOT EXISTS idx_live_rooms_active ON public.live_rooms(is_active);
CREATE INDEX IF NOT EXISTS idx_live_rooms_type ON public.live_rooms(room_type);
CREATE INDEX IF NOT EXISTS idx_live_rooms_created_at ON public.live_rooms(created_at);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tier ON public.subscriptions(tier);
CREATE INDEX IF NOT EXISTS idx_subscriptions_created_at ON public.subscriptions(created_at);

CREATE INDEX IF NOT EXISTS idx_coin_transactions_user ON public.coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_type ON public.coin_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_created_at ON public.coin_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON public.blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked ON public.blocked_users(blocked_user_id);

CREATE INDEX IF NOT EXISTS idx_profile_reports_reporter ON public.profile_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_profile_reports_reported ON public.profile_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_profile_reports_status ON public.profile_reports(status);
CREATE INDEX IF NOT EXISTS idx_profile_reports_category ON public.profile_reports(category);

CREATE INDEX IF NOT EXISTS idx_safety_alerts_user ON public.safety_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_safety_alerts_type ON public.safety_alerts(alert_type);

CREATE INDEX IF NOT EXISTS idx_swipe_history_user ON public.swipe_history(user_id);
CREATE INDEX IF NOT EXISTS idx_swipe_history_created_at ON public.swipe_history(created_at);

CREATE INDEX IF NOT EXISTS idx_daily_recommendations_user ON public.daily_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_recommendations_date ON public.daily_recommendations(date);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_user ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON public.payment_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_room_participants_room ON public.room_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_user ON public.room_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_joined_at ON public.room_participants(joined_at);

-- Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sent_gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swipe_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_participants ENABLE ROW LEVEL SECURITY;

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
    AND status = 'matched'
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

-- Blocked users: Users can view their own blocks
CREATE POLICY "Users can view their blocked users" ON public.blocked_users FOR SELECT 
USING (blocker_id = auth.uid());

-- Profile reports: Users can create reports
CREATE POLICY "Users can create reports" ON public.profile_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users can view reports they made" ON public.profile_reports FOR SELECT USING (reporter_id = auth.uid());

-- Moderation actions: Moderators can manage reports
CREATE POLICY "Moderators can manage reports" ON public.moderation_actions FOR ALL USING (true);

-- Phone history: Users can view their own history
CREATE POLICY "Users can view own phone history" ON public.phone_history FOR SELECT USING (user_id = auth.uid());

-- Safety alerts: Moderators can view alerts
CREATE POLICY "Moderators can view safety alerts" ON public.safety_alerts FOR SELECT USING (true);

-- Swipe history: Users can view their own history
CREATE POLICY "Users can view own swipe history" ON public.swipe_history FOR SELECT USING (user_id = auth.uid());

-- Daily recommendations: Users can view their recommendations
CREATE POLICY "Users can view their recommendations" ON public.daily_recommendations FOR SELECT USING (user_id = auth.uid());

-- Payment transactions: Users can view their transactions
CREATE POLICY "Users can view their payment transactions" ON public.payment_transactions FOR SELECT USING (user_id = auth.uid());

-- Room participants: Users can view participants in rooms they're in
CREATE POLICY "Users can view room participants" ON public.room_participants FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.live_rooms lr
  JOIN public.room_participants rp ON lr.id = rp.room_id
  WHERE rp.user_id = auth.uid()
  AND lr.is_active = true)
);

-- Functions and triggers

-- Function to update updated_at timestamp
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
CREATE TRIGGER handle_sent_gifts_updated_at BEFORE UPDATE ON public.sent_gifts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_live_rooms_updated_at BEFORE UPDATE ON public.live_rooms FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_coin_transactions_updated_at BEFORE UPDATE ON public.coin_transactions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_blocked_users_updated_at BEFORE UPDATE ON public.blocked_users FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_profile_reports_updated_at BEFORE UPDATE ON public.profile_reports FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_moderation_actions_updated_at BEFORE UPDATE ON public.moderation_actions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_phone_history_updated_at BEFORE UPDATE ON public.phone_history FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_safety_alerts_updated_at BEFORE UPDATE ON public.safety_alerts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_swipe_history_updated_at BEFORE UPDATE ON public.swipe_history FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_daily_recommendations_updated_at BEFORE UPDATE ON public.daily_recommendations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_payment_transactions_updated_at BEFORE UPDATE ON public.payment_transactions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, country)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'country', 'RW')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
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

-- Function to get user's gift statistics
CREATE OR REPLACE FUNCTION public.get_user_gift_stats(user_uuid UUID)
RETURNS TABLE (
  total_sent BIGINT,
  total_received BIGINT,
  coins_spent BIGINT,
  coins_earned BIGINT,
  favorite_gift_id UUID,
  most_generous_user_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(sent_count, 0) as total_sent,
    COALESCE(received_count, 0) as total_received,
    COALESCE(spent_amount, 0) as coins_spent,
    COALESCE(earned_amount, 0) as coins_earned,
    COALESCE(fav_gift_id, NULL) as favorite_gift_id,
    COALESCE(most_generous_id, NULL) as most_generous_user_id
  FROM (
    SELECT 
      (SELECT COUNT(*) FROM public.sent_gifts WHERE from_user_id = user_uuid) as sent_count,
      (SELECT SUM(g.cost_coins) FROM public.sent_gifts sg 
       JOIN public.gifts g ON sg.gift_id = g.id 
       WHERE sg.from_user_id = user_uuid) as spent_amount,
      (SELECT COUNT(*) FROM public.sent_gifts WHERE to_user_id = user_uuid) as received_count,
      (SELECT SUM(g.cost_coins * 0.1) FROM public.sent_gifts sg 
       JOIN public.gifts g ON sg.gift_id = g.id 
       WHERE sg.to_user_id = user_uuid) as earned_amount,
      (SELECT gift_id FROM public.sent_gifts WHERE from_user_id = user_uuid 
       GROUP BY gift_id ORDER BY COUNT(*) DESC LIMIT 1) as fav_gift_id,
      (SELECT from_user_id FROM public.sent_gifts WHERE to_user_id = user_uuid 
       GROUP BY from_user_id ORDER BY COUNT(*) DESC LIMIT 1) as most_generous_id
  ) stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's match statistics
CREATE OR REPLACE FUNCTION public.get_user_match_stats(user_uuid UUID)
RETURNS TABLE (
  total_swipes BIGINT,
  likes BIGINT,
  passes BIGINT,
  matches_count BIGINT,
  match_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(swipe_count, 0) as total_swipes,
    COALESCE(like_count, 0) as likes,
    COALESCE(pass_count, 0) as passes,
    COALESCE(match_count, 0) as matches_count,
    CASE 
      WHEN swipe_count > 0 THEN 
        ROUND((match_count::NUMERIC / swipe_count::NUMERIC) * 100, 2)
      ELSE 0 
    END as match_rate
  FROM (
    SELECT 
      (SELECT COUNT(*) FROM public.swipe_history WHERE user_id = user_uuid) as swipe_count,
      (SELECT COUNT(*) FROM public.swipe_history WHERE user_id = user_uuid AND action = 'like') as like_count,
      (SELECT COUNT(*) FROM public.swipe_history WHERE user_id = user_uuid AND action = 'pass') as pass_count,
      (SELECT COUNT(*) FROM public.matches 
       WHERE (user1_id = user_uuid OR user2_id = user_uuid) 
       AND status = 'matched') as match_count
  ) stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get trending gifts
CREATE OR REPLACE FUNCTION public.get_trending_gifts(limit_param INTEGER DEFAULT 10)
RETURNS TABLE (
  gift_id UUID,
  gift_name TEXT,
  gift_tier gift_tier,
  cost_coins INTEGER,
  sent_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id as gift_id,
    g.name as gift_name,
    g.tier as gift_tier,
    g.cost_coins,
    COUNT(*) as sent_count
  FROM public.gifts g
  JOIN public.sent_gifts sg ON g.id = sg.gift_id
  WHERE g.is_active = true
    AND sg.created_at >= NOW() - INTERVAL '7 days'
  GROUP BY g.id, g.name, g.tier, g.cost_coins
  ORDER BY sent_count DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's subscription benefits
CREATE OR REPLACE FUNCTION public.user_has_premium_feature(user_uuid UUID, feature_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT EXISTS (
      SELECT 1 FROM public.subscriptions s
      JOIN public.profiles p ON s.user_id = p.id
      WHERE s.user_id = user_uuid 
        AND s.status = 'active'
        AND s.end_date > NOW()
        AND (
          (feature_name = 'unlimited_swipes' AND s.tier IN ('basic', 'premium', 'platinum', 'diamond')) OR
          (feature_name = 'see_who_liked' AND s.tier IN ('basic', 'premium', 'platinum', 'diamond')) OR
          (feature_name = 'free_boosts_per_week' AND s.tier = 'basic' AND 1 >= 1) OR
          (feature_name = 'free_boosts_per_week' AND s.tier = 'premium' AND 5 >= 1) OR
          (feature_name = 'free_boosts_per_week' AND s.tier = 'platinum' AND 10 >= 1) OR
          (feature_name = 'free_boosts_per_week' AND s.tier = 'diamond' AND 20 >= 1) OR
          (feature_name = 'send_voice_messages' AND s.tier IN ('basic', 'premium', 'platinum', 'diamond')) OR
          (feature_name = 'no_ads' AND s.tier IN ('basic', 'premium', 'platinum', 'diamond')) OR
          (feature_name = 'unlimited_rewind' AND s.tier IN ('premium', 'platinum', 'diamond')) OR
          (feature_name = 'read_receipts' AND s.tier IN ('premium', 'platinum', 'diamond')) OR
          (feature_name = 'priority_support' AND s.tier IN ('premium', 'platinum', 'diamond')) OR
          (feature_name = 'exclusive_gifts' AND s.tier IN ('premium', 'platinum', 'diamond')) OR
          (feature_name = 'vip_badge' AND s.tier IN ('platinum', 'diamond')) OR
          (feature_name = 'top_search_ranking' AND s.tier IN ('platinum', 'diamond')) OR
          (feature_name = 'private_mode' AND s.tier IN ('platinum', 'diamond')) OR
          (feature_name = 'monthly_coins_bonus' AND s.tier = 'premium' AND 500 >= 1) OR
          (feature_name = 'monthly_coins_bonus' AND s.tier = 'platinum' AND 500 >= 1) OR
          (feature_name = 'monthly_coins_bonus' AND s.tier = 'diamond' AND 2000 >= 1) OR
          (feature_name = 'exclusive_events' AND s.tier IN ('platinum', 'diamond')) OR
          (feature_name = 'personal_matchmaker' AND s.tier = 'diamond') OR
          (feature_name = 'real_gift_concierge' AND s.tier = 'diamond') OR
          (feature_name = 'featured_profile' AND s.tier = 'diamond') OR
          (feature_name = 'vip_mixers' AND s.tier = 'diamond')
        )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate compatibility score
CREATE OR REPLACE FUNCTION public.calculate_compatibility_score(user1_uuid UUID, user2_uuid UUID)
RETURNS TABLE (
  score INTEGER,
  reasons TEXT[]
) AS $$
DECLARE
  age_score INTEGER := 0;
  country_score INTEGER := 0;
  city_score INTEGER := 0;
  language_score INTEGER := 0;
  interest_score INTEGER := 0;
  intention_score INTEGER := 0;
  verification_score INTEGER := 0;
  vip_score INTEGER := 0;
  tribe_score INTEGER := 0;
  total_score INTEGER := 0;
  reason_list TEXT[];
  user1 RECORD;
  user2 RECORD;
BEGIN
  -- Get user profiles
  SELECT * INTO user1 FROM public.profiles WHERE id = user1_uuid;
  SELECT * INTO user2 FROM public.profiles WHERE id = user2_uuid;
  
  -- Age compatibility (20 points)
  IF user1.age IS NOT NULL AND user2.age IS NOT NULL THEN
    IF ABS(user1.age - user2.age) <= 5 THEN
      age_score := 20;
      reason_list := array_append(reason_list, 'Similar age range');
    ELSIF ABS(user1.age - user2.age) <= 10 THEN
      age_score := 10;
    END IF;
  END IF;
  
  -- Location compatibility (25 points)
  IF user1.country = user2.country THEN
    country_score := 15;
    reason_list := array_append(reason_list, 'Same country');
    
    IF user1.city = user2.city AND user1.country = user2.country THEN
      city_score := 10;
      reason_list := array_append(reason_list, 'Same city');
    END IF;
  END IF;
  
  -- Language compatibility (15 points)
  IF user1.languages IS NOT NULL AND user2.languages IS NOT NULL THEN
    DECLARE
      common_lang INTEGER;
    BEGIN
      SELECT COUNT(*) INTO common_lang FROM unnest(user1.languages) lang
      WHERE lang = ANY(user2.languages);
      
      language_score := common_lang * 5;
      IF common_lang > 0 THEN
        reason_list := array_append(reason_list, 'Common languages');
      END IF;
    END;
  END IF;
  
  -- Interest compatibility (20 points)
  IF user1.interests IS NOT NULL AND user2.interests IS NOT NULL THEN
    DECLARE
      common_int INTEGER;
    BEGIN
      SELECT COUNT(*) INTO common_int FROM unnest(user1.interests) interest
      WHERE interest = ANY(user2.interests);
      
      interest_score := common_int * 4;
      IF common_int > 0 THEN
        reason_list := array_append(reason_list, 'Common interests');
      END IF;
    END;
  END IF;
  
  -- Relationship intention compatibility (10 points)
  IF user1.relationship_intention = user2.relationship_intention THEN
    intention_score := 10;
    reason_list := array_append(reason_list, 'Similar relationship goals');
  END IF;
  
  -- Verification level bonus (5 points)
  IF user2.verification_level = 'premium' THEN
    verification_score := 5;
    reason_list := array_append(reason_list, 'Verified user');
  ELSIF user2.verification_level = 'standard' THEN
    verification_score := 3;
  END IF;
  
  -- VIP status bonus (5 points)
  IF user2.vip_tier != 'free' THEN
    vip_score := 5;
    reason_list := array_append(reason_list, 'VIP member');
  END IF;
  
  -- Tribe compatibility (5 points)
  IF user1.tribe IS NOT NULL AND user2.tribe IS NOT NULL AND user1.tribe = user2.tribe THEN
    tribe_score := 5;
    reason_list := array_append(reason_list, 'Same tribe/ethnic group');
  END IF;
  
  -- Calculate total
  total_score := age_score + country_score + city_score + language_score + 
                 interest_score + intention_score + verification_score + 
                 vip_score + tribe_score;
  
  RETURN QUERY SELECT total_score, reason_list;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Views for common queries
CREATE OR REPLACE VIEW public.user_profiles_with_stats AS
SELECT 
  p.*,
  (SELECT row_to_json(g) FROM public.get_user_gift_stats(p.id) g) as gift_stats,
  (SELECT row_to_json(m) FROM public.get_user_match_stats(p.id) m) as match_stats
FROM public.profiles p;

CREATE OR REPLACE VIEW public.active_subscriptions AS
SELECT 
  s.*,
  p.username,
  p.full_name,
  p.avatar_url,
  p.vip_tier
FROM public.subscriptions s
JOIN public.profiles p ON s.user_id = p.id
WHERE s.status = 'active' AND s.end_date > NOW();

CREATE OR REPLACE VIEW public.trending_gifts_view AS
SELECT * FROM public.get_trending_gifts(20);

COMMIT;