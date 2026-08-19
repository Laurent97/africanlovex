-- ============================================================================
-- LoveX COMPLETE LAUNCH SETUP
-- Idempotent script: safe to run multiple times on the Supabase SQL Editor.
-- Creates EVERY table, column, function, policy and seed data the app uses.
-- Run this ONCE in full. Order matters.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. CORE PROFILE TABLE + ALL COLUMNS THE APP USES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    country TEXT DEFAULT 'Rwanda',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS age INTEGER,
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS tribe TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS occupation TEXT,
  ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS relationship_intention TEXT,
  ADD COLUMN IF NOT EXISTS verification_level TEXT DEFAULT 'basic',
  ADD COLUMN IF NOT EXISTS verification_badge TEXT,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS vip_tier TEXT DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS coins_balance BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS matches INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS response_rate INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS height INTEGER,
  ADD COLUMN IF NOT EXISTS education TEXT,
  ADD COLUMN IF NOT EXISTS drinking TEXT,
  ADD COLUMN IF NOT EXISTS smoking TEXT,
  ADD COLUMN IF NOT EXISTS kids TEXT,
  ADD COLUMN IF NOT EXISTS religion TEXT,
  ADD COLUMN IF NOT EXISTS instagram TEXT,
  ADD COLUMN IF NOT EXISTS spotify TEXT,
  ADD COLUMN IF NOT EXISTS dating_preferences JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS relationship_goals TEXT DEFAULT 'casual',
  ADD COLUMN IF NOT EXISTS looking_for_age_min INTEGER DEFAULT 18,
  ADD COLUMN IF NOT EXISTS looking_for_age_max INTEGER DEFAULT 100,
  ADD COLUMN IF NOT EXISTS gender_preferences TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create a profile whenever a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, country)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1), 'user_' || left(NEW.id::text, 8)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'country', 'Rwanda')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 2. PROFILE PHOTOS (pictures) + RPC FUNCTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profile_photos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_profile_photos_user ON public.profile_photos(user_id);

ALTER TABLE public.profile_photos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Photos viewable by everyone" ON public.profile_photos;
DROP POLICY IF EXISTS "Users manage own photos insert" ON public.profile_photos;
DROP POLICY IF EXISTS "Users manage own photos update" ON public.profile_photos;
DROP POLICY IF EXISTS "Users manage own photos delete" ON public.profile_photos;
CREATE POLICY "Photos viewable by everyone" ON public.profile_photos FOR SELECT USING (true);
CREATE POLICY "Users manage own photos insert" ON public.profile_photos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own photos update" ON public.profile_photos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users manage own photos delete" ON public.profile_photos FOR DELETE USING (auth.uid() = user_id);

DROP FUNCTION IF EXISTS public.get_user_photos(UUID);
CREATE FUNCTION public.get_user_photos(user_uuid UUID)
RETURNS TABLE (id UUID, user_id UUID, photo_url TEXT, is_primary BOOLEAN, sort_order INTEGER, created_at TIMESTAMPTZ) AS $$
BEGIN
  RETURN QUERY
  SELECT pp.id, pp.user_id, pp.photo_url, pp.is_primary, pp.sort_order, pp.created_at
  FROM public.profile_photos pp
  WHERE pp.user_id = user_uuid
  ORDER BY pp.is_primary DESC, pp.sort_order ASC, pp.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.add_profile_photo(UUID, TEXT, BOOLEAN);
CREATE FUNCTION public.add_profile_photo(user_uuid UUID, photo_url_in TEXT, make_primary BOOLEAN DEFAULT false)
RETURNS UUID AS $$
DECLARE new_id UUID;
BEGIN
  IF make_primary THEN
    UPDATE public.profile_photos SET is_primary = false WHERE user_id = user_uuid;
  END IF;
  INSERT INTO public.profile_photos (user_id, photo_url, is_primary)
  VALUES (user_uuid, photo_url_in, make_primary)
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.delete_profile_photo(UUID, UUID);
CREATE FUNCTION public.delete_profile_photo(user_uuid UUID, photo_id UUID)
RETURNS VOID AS $$
BEGIN
  DELETE FROM public.profile_photos WHERE id = photo_id AND user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.set_main_photo(UUID, UUID);
CREATE FUNCTION public.set_main_photo(user_uuid UUID, photo_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profile_photos SET is_primary = false WHERE user_id = user_uuid;
  UPDATE public.profile_photos SET is_primary = true WHERE id = photo_id AND user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.reorder_photos(UUID, UUID[]);
CREATE FUNCTION public.reorder_photos(user_uuid UUID, photo_ids UUID[])
RETURNS VOID AS $$
DECLARE i INTEGER;
BEGIN
  FOR i IN 1..array_length(photo_ids, 1) LOOP
    UPDATE public.profile_photos SET sort_order = i WHERE id = photo_ids[i] AND user_id = user_uuid;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.get_photo_count(UUID);
CREATE FUNCTION public.get_photo_count(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE cnt INTEGER;
BEGIN
  SELECT COUNT(*) INTO cnt FROM public.profile_photos WHERE user_id = user_uuid;
  RETURN cnt;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- avatars table (legacy reference)
CREATE TABLE IF NOT EXISTS public.avatars (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.avatars ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Avatars viewable" ON public.avatars;
DROP POLICY IF EXISTS "Users manage own avatars" ON public.avatars;
CREATE POLICY "Avatars viewable" ON public.avatars FOR SELECT USING (true);
CREATE POLICY "Users manage own avatars" ON public.avatars FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- 3. MATCHING SYSTEM (swipes, matches, recommendations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

CREATE TABLE IF NOT EXISTS public.swipe_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('like', 'pass', 'super_like')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.daily_recommendations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swipe_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_recommendations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own matches" ON public.matches;
DROP POLICY IF EXISTS "Users create matches" ON public.matches;
DROP POLICY IF EXISTS "Users update own matches" ON public.matches;
DROP POLICY IF EXISTS "Users manage own swipes" ON public.swipe_history;
DROP POLICY IF EXISTS "Users view own recommendations" ON public.daily_recommendations;
CREATE POLICY "Users view own matches" ON public.matches FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "Users create matches" ON public.matches FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "Users update own matches" ON public.matches FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "Users manage own swipes" ON public.swipe_history FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users view own recommendations" ON public.daily_recommendations FOR SELECT USING (auth.uid() = user_id);

DROP FUNCTION IF EXISTS public.can_match(UUID, UUID);
CREATE FUNCTION public.can_match(user_a UUID, user_b UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.blocked_users
    WHERE (blocker_id = user_a AND blocked_user_id = user_b)
       OR (blocker_id = user_b AND blocked_user_id = user_a)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. MESSAGING SYSTEM (chat + room chat) + RPCs
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS conversation_id UUID,
  ADD COLUMN IF NOT EXISTS room_id UUID,
  ADD COLUMN IF NOT EXISTS match_id UUID,
  ADD COLUMN IF NOT EXISTS gift_id UUID,
  ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- message_type as TEXT with a permissive CHECK (covers TikTok-style room events)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'message_type' AND data_type = 'USER-DEFINED'
  ) THEN
    ALTER TABLE public.messages ALTER COLUMN message_type DROP DEFAULT;
    ALTER TABLE public.messages ALTER COLUMN message_type TYPE TEXT USING message_type::TEXT;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'message_type'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN message_type TEXT;
  END IF;
END $$;
ALTER TABLE public.messages ALTER COLUMN message_type SET DEFAULT 'text';
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_message_type_check;
ALTER TABLE public.messages ADD CONSTRAINT messages_message_type_check
  CHECK (message_type IN ('text', 'image', 'voice', 'gift', 'system', 'dating_interest', 'join', 'leave'));

CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages(receiver_id, read);
CREATE INDEX IF NOT EXISTS idx_messages_room ON public.messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read their messages" ON public.messages;
DROP POLICY IF EXISTS "Users send messages" ON public.messages;
DROP POLICY IF EXISTS "Users update their messages" ON public.messages;
CREATE POLICY "Users read their messages" ON public.messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR room_id IS NOT NULL);
CREATE POLICY "Users send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users update their messages" ON public.messages
  FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP FUNCTION IF EXISTS public.get_user_conversations(UUID);
CREATE FUNCTION public.get_user_conversations(user_uuid UUID)
RETURNS TABLE (
  conversation_id UUID,
  other_user_id UUID,
  other_username TEXT,
  other_full_name TEXT,
  other_avatar_url TEXT,
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  unread_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH conv AS (
    SELECT DISTINCT ON (pair)
      m.conversation_id AS cid,
      CASE WHEN m.sender_id = user_uuid THEN m.receiver_id ELSE m.sender_id END AS other_id,
      m.content, m.created_at,
      LEAST(m.sender_id::text, m.receiver_id::text) || GREATEST(m.sender_id::text, m.receiver_id::text) AS pair
    FROM public.messages m
    WHERE (m.sender_id = user_uuid OR m.receiver_id = user_uuid) AND m.room_id IS NULL
    ORDER BY pair, m.created_at DESC
  )
  SELECT
    COALESCE(c.cid, uuid_generate_v4()),
    c.other_id,
    p.username, p.full_name, p.avatar_url,
    c.content, c.created_at,
    (SELECT COUNT(*) FROM public.messages m2
      WHERE m2.sender_id = c.other_id AND m2.receiver_id = user_uuid AND m2.read = false)
  FROM conv c
  JOIN public.profiles p ON p.id = c.other_id
  ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.get_conversation_messages(UUID, UUID);
CREATE FUNCTION public.get_conversation_messages(user_uuid UUID, other_uuid UUID)
RETURNS TABLE (id UUID, sender_id UUID, receiver_id UUID, content TEXT, message_type TEXT, read BOOLEAN, created_at TIMESTAMPTZ) AS $$
BEGIN
  RETURN QUERY
  SELECT m.id, m.sender_id, m.receiver_id, m.content, m.message_type, m.read, m.created_at
  FROM public.messages m
  WHERE (m.sender_id = user_uuid AND m.receiver_id = other_uuid)
     OR (m.sender_id = other_uuid AND m.receiver_id = user_uuid)
  ORDER BY m.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.send_message(UUID, UUID, TEXT, TEXT);
CREATE FUNCTION public.send_message(sender UUID, receiver UUID, content_in TEXT, type_in TEXT DEFAULT 'text')
RETURNS UUID AS $$
DECLARE new_id UUID;
BEGIN
  INSERT INTO public.messages (sender_id, receiver_id, content, message_type)
  VALUES (sender, receiver, content_in, type_in)
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.mark_messages_as_read(UUID[], UUID);
CREATE FUNCTION public.mark_messages_as_read(message_ids UUID[], user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.messages SET read = true
  WHERE id = ANY(message_ids) AND receiver_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.mark_messages_read(UUID, UUID);
CREATE FUNCTION public.mark_messages_read(user_uuid UUID, other_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.messages SET read = true
  WHERE receiver_id = user_uuid AND sender_id = other_uuid AND read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.get_unread_messages(UUID);
CREATE FUNCTION public.get_unread_messages(user_uuid UUID)
RETURNS BIGINT AS $$
DECLARE cnt BIGINT;
BEGIN
  SELECT COUNT(*) INTO cnt FROM public.messages
  WHERE receiver_id = user_uuid AND read = false;
  RETURN cnt;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. GIFTS SYSTEM (TikTok-style: catalog, sending, inventory, coins, exchange)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.gifts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  name_local TEXT,
  description TEXT,
  tier TEXT DEFAULT 'everyday',
  cost_coins INTEGER NOT NULL DEFAULT 10,
  animation_url TEXT,
  icon_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Gifts viewable by everyone" ON public.gifts;
CREATE POLICY "Gifts viewable by everyone" ON public.gifts FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.sent_gifts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  from_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  gift_id UUID REFERENCES public.gifts(id) ON DELETE CASCADE,
  room_id UUID,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.sent_gifts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view gifts they sent or received" ON public.sent_gifts;
DROP POLICY IF EXISTS "Users send gifts" ON public.sent_gifts;
CREATE POLICY "Users view gifts they sent or received" ON public.sent_gifts
  FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
CREATE POLICY "Users send gifts" ON public.sent_gifts FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE TABLE IF NOT EXISTS public.gift_inventory (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  gift_id UUID REFERENCES public.gifts(id),
  gift_name TEXT,
  gift_icon TEXT,
  rarity TEXT DEFAULT 'common',
  quantity INTEGER DEFAULT 1,
  is_locked BOOLEAN DEFAULT false,
  purchase_date TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.user_gift_inventory (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  gift_id UUID REFERENCES public.gifts(id),
  gift_name TEXT,
  gift_icon TEXT,
  rarity TEXT DEFAULT 'common',
  quantity INTEGER DEFAULT 1,
  purchase_date TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.gift_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  gift_id UUID REFERENCES public.gifts(id),
  gift_name TEXT,
  coins_amount INTEGER DEFAULT 0,
  context TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.gift_exchange_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  gift_id UUID,
  gift_name TEXT,
  coins_received INTEGER DEFAULT 0,
  exchanged_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.gift_exchange_rates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  gift_rarity TEXT UNIQUE NOT NULL,
  exchange_rate NUMERIC DEFAULT 0.5,
  base_price INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Ensure the columns the app needs are present on legacy tables as well
ALTER TABLE public.gift_exchange_rates ADD COLUMN IF NOT EXISTS gift_rarity TEXT;
ALTER TABLE public.gift_exchange_rates ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC DEFAULT 0.5;
ALTER TABLE public.gift_exchange_rates ADD COLUMN IF NOT EXISTS base_price INTEGER DEFAULT 100;
ALTER TABLE public.gift_exchange_rates ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE public.gift_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_gift_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_exchange_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_exchange_rates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own gift inventory" ON public.gift_inventory;
DROP POLICY IF EXISTS "Users manage own user gift inventory" ON public.user_gift_inventory;
DROP POLICY IF EXISTS "Users view own gift transactions" ON public.gift_transactions;
DROP POLICY IF EXISTS "Users insert gift transactions" ON public.gift_transactions;
DROP POLICY IF EXISTS "Users view own exchanges" ON public.gift_exchange_history;
DROP POLICY IF EXISTS "Users insert own exchanges" ON public.gift_exchange_history;
DROP POLICY IF EXISTS "Exchange rates viewable" ON public.gift_exchange_rates;
CREATE POLICY "Users manage own gift inventory" ON public.gift_inventory FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own user gift inventory" ON public.user_gift_inventory FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users view own gift transactions" ON public.gift_transactions
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users insert gift transactions" ON public.gift_transactions FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users view own exchanges" ON public.gift_exchange_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own exchanges" ON public.gift_exchange_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Exchange rates viewable" ON public.gift_exchange_rates FOR SELECT USING (true);

DROP FUNCTION IF EXISTS public.update_coins_balance(UUID, BIGINT);
CREATE FUNCTION public.update_coins_balance(user_uuid UUID, amount BIGINT)
RETURNS BIGINT AS $$
DECLARE new_balance BIGINT;
BEGIN
  UPDATE public.profiles
  SET coins_balance = GREATEST(0, coins_balance + amount)
  WHERE id = user_uuid
  RETURNING coins_balance INTO new_balance;
  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.add_gift_to_inventory(UUID, UUID, TEXT, TEXT, TEXT, INTEGER);
CREATE FUNCTION public.add_gift_to_inventory(
  user_uuid UUID, gift_uuid UUID, gift_name_in TEXT, gift_icon_in TEXT,
  rarity_in TEXT DEFAULT 'common', qty INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.gift_inventory (user_id, gift_id, gift_name, gift_icon, rarity, quantity)
  VALUES (user_uuid, gift_uuid, gift_name_in, gift_icon_in, rarity_in, qty);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed the TikTok-style gift catalog (only if empty, handles gift_tier enum or text column)
DO $$
BEGIN
  IF (SELECT COUNT(*) = 0 FROM public.gifts) THEN
    IF to_regtype('public.gift_tier') IS NOT NULL THEN
      INSERT INTO public.gifts (name, name_local, description, tier, cost_coins, icon_url, is_active)
      SELECT v.name, v.name_local, v.description, v.tier::public.gift_tier, v.cost_coins, v.icon_url, v.is_active
      FROM (VALUES
        ('Rose', 'Rose', 'A classic rose to show appreciation', 'everyday', 1, '🌹', true),
        ('Heart', 'Heart', 'Send some love', 'everyday', 5, '❤️', true),
        ('Coffee', 'Ikawa', 'Buy them a virtual coffee', 'everyday', 10, '☕', true),
        ('Chocolate', 'Chocolat', 'Sweet treats for a sweet person', 'romantic', 25, '🍫', true),
        ('Perfume', 'Parfum', 'A touch of elegance', 'romantic', 50, '🌸', true),
        ('Love Letter', 'Ibaruwa', 'A heartfelt letter', 'romantic', 15, '💌', true),
        ('Teddy Bear', 'Teddy', 'Cuddly companion', 'romantic', 75, '🧸', true),
        ('Promise Ring', 'Impeta', 'A promise of commitment', 'serious', 100, '💫', true),
        ('Diamond', 'Diamant', 'Precious like them', 'serious', 200, '💎', true),
        ('Crown', 'Ikamba', 'Treat them like royalty', 'legendary', 500, '👑', true),
        ('Infinity Heart', 'Urukundo', 'Love without end', 'legendary', 1000, '💞', true),
        ('Shooting Star', 'Inyenyeri', 'Make a wish', 'legendary', 750, '🌠', true),
        ('Dinner Date', 'Diner', 'A real dinner date invitation', 'real_world', 300, '🍷', true),
        ('Weekend Trip', 'Voyage', 'An unforgettable getaway', 'real_world', 2000, '✈️', true)
      ) AS v(name, name_local, description, tier, cost_coins, icon_url, is_active);
    ELSE
      INSERT INTO public.gifts (name, name_local, description, tier, cost_coins, icon_url, is_active)
      SELECT v.name, v.name_local, v.description, v.tier::text, v.cost_coins, v.icon_url, v.is_active
      FROM (VALUES
        ('Rose', 'Rose', 'A classic rose to show appreciation', 'everyday', 1, '🌹', true),
        ('Heart', 'Heart', 'Send some love', 'everyday', 5, '❤️', true),
        ('Coffee', 'Ikawa', 'Buy them a virtual coffee', 'everyday', 10, '☕', true),
        ('Chocolate', 'Chocolat', 'Sweet treats for a sweet person', 'romantic', 25, '🍫', true),
        ('Perfume', 'Parfum', 'A touch of elegance', 'romantic', 50, '🌸', true),
        ('Love Letter', 'Ibaruwa', 'A heartfelt letter', 'romantic', 15, '💌', true),
        ('Teddy Bear', 'Teddy', 'Cuddly companion', 'romantic', 75, '🧸', true),
        ('Promise Ring', 'Impeta', 'A promise of commitment', 'serious', 100, '💫', true),
        ('Diamond', 'Diamant', 'Precious like them', 'serious', 200, '💎', true),
        ('Crown', 'Ikamba', 'Treat them like royalty', 'legendary', 500, '👑', true),
        ('Infinity Heart', 'Urukundo', 'Love without end', 'legendary', 1000, '💞', true),
        ('Shooting Star', 'Inyenyeri', 'Make a wish', 'legendary', 750, '🌠', true),
        ('Dinner Date', 'Diner', 'A real dinner date invitation', 'real_world', 300, '🍷', true),
        ('Weekend Trip', 'Voyage', 'An unforgettable getaway', 'real_world', 2000, '✈️', true)
      ) AS v(name, name_local, description, tier, cost_coins, icon_url, is_active);
    END IF;
  END IF;
END $$;

-- Seed exchange rates (matches the app's expected gift_rarity/exchange_rate/base_price/is_active columns)
DO $$
DECLARE
  col_count INT;
  rarity_type TEXT;
BEGIN
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'gift_exchange_rates'
    AND column_name IN ('gift_rarity', 'exchange_rate', 'base_price', 'is_active');

  IF col_count = 4 THEN
    SELECT data_type INTO rarity_type
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gift_exchange_rates' AND column_name = 'gift_rarity';

    IF rarity_type = 'USER-DEFINED' THEN
      EXECUTE '
        INSERT INTO public.gift_exchange_rates (gift_rarity, exchange_rate, base_price, is_active)
        SELECT v.gift_rarity::gift_rarity, v.exchange_rate, v.base_price, v.is_active
        FROM (VALUES
          (''common'', 0.5, 100, true),
          (''rare'', 0.6, 200, true),
          (''epic'', 0.7, 500, true),
          (''legendary'', 0.8, 1000, true),
          (''mythic'', 0.9, 2500, true)
        ) AS v(gift_rarity, exchange_rate, base_price, is_active)
        WHERE NOT EXISTS (
          SELECT 1 FROM public.gift_exchange_rates g WHERE g.gift_rarity = v.gift_rarity::gift_rarity
        )';
    ELSE
      INSERT INTO public.gift_exchange_rates (gift_rarity, exchange_rate, base_price, is_active)
      SELECT v.gift_rarity, v.exchange_rate, v.base_price, v.is_active
      FROM (VALUES
        ('common', 0.5, 100, true),
        ('rare', 0.6, 200, true),
        ('epic', 0.7, 500, true),
        ('legendary', 0.8, 1000, true),
        ('mythic', 0.9, 2500, true)
      ) AS v(gift_rarity, exchange_rate, base_price, is_active)
      WHERE NOT EXISTS (
        SELECT 1 FROM public.gift_exchange_rates g WHERE g.gift_rarity = v.gift_rarity
      );
    END IF;
  END IF;
END $$;

-- ============================================================================
-- 6. LIVE STREAMING (TikTok Live style)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.live_rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  host_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  room_type TEXT DEFAULT 'public',
  is_active BOOLEAN DEFAULT true,
  viewer_count INTEGER DEFAULT 0,
  max_viewers INTEGER DEFAULT 1000,
  cost_per_minute INTEGER,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.live_rooms
  ADD COLUMN IF NOT EXISTS host_name TEXT,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'entertainment',
  ADD COLUMN IF NOT EXISTS dating_focus TEXT DEFAULT 'casual',
  ADD COLUMN IF NOT EXISTS min_age_preference INTEGER,
  ADD COLUMN IF NOT EXISTS max_age_preference INTEGER,
  ADD COLUMN IF NOT EXISTS gender_preference TEXT[],
  ADD COLUMN IF NOT EXISTS total_gifts_received INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_coins_earned BIGINT DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.room_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES public.live_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'viewer',
  is_host BOOLEAN DEFAULT false,
  is_muted BOOLEAN DEFAULT false,
  is_video_enabled BOOLEAN DEFAULT true,
  is_interested BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  UNIQUE(room_id, user_id)
);
-- Ensure legacy room_participants tables have the columns Live.tsx expects
ALTER TABLE public.room_participants
  ADD COLUMN IF NOT EXISTS is_host BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_video_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_interested BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS public.stream_matches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  stream_id UUID REFERENCES public.live_rooms(id) ON DELETE CASCADE,
  user1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(stream_id, user1_id, user2_id)
);

CREATE TABLE IF NOT EXISTS public.room_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES public.live_rooms(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.live_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Live rooms viewable by everyone" ON public.live_rooms;
DROP POLICY IF EXISTS "Hosts create rooms" ON public.live_rooms;
DROP POLICY IF EXISTS "Hosts update own rooms" ON public.live_rooms;

-- Wipe all room_participants policies (legacy ones can cause infinite recursion)
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'room_participants'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.room_participants', pol.policyname);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "Participants viewable" ON public.room_participants;
DROP POLICY IF EXISTS "Users join rooms" ON public.room_participants;
DROP POLICY IF EXISTS "Users update own participation" ON public.room_participants;
DROP POLICY IF EXISTS "Users leave rooms" ON public.room_participants;
DROP POLICY IF EXISTS "Users view own stream matches" ON public.stream_matches;
DROP POLICY IF EXISTS "Users create stream matches" ON public.stream_matches;
DROP POLICY IF EXISTS "Users update own stream matches" ON public.stream_matches;
DROP POLICY IF EXISTS "Users report rooms" ON public.room_reports;
CREATE POLICY "Live rooms viewable by everyone" ON public.live_rooms FOR SELECT USING (true);
CREATE POLICY "Hosts create rooms" ON public.live_rooms FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Hosts update own rooms" ON public.live_rooms FOR UPDATE USING (auth.uid() = host_id);
CREATE POLICY "Participants viewable" ON public.room_participants FOR SELECT USING (true);
CREATE POLICY "Users join rooms" ON public.room_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own participation" ON public.room_participants FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users leave rooms" ON public.room_participants FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Hosts can manage participants" ON public.room_participants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.live_rooms lr
      WHERE lr.id = room_participants.room_id AND lr.host_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.live_rooms lr
      WHERE lr.id = room_participants.room_id AND lr.host_id = auth.uid()
    )
  );
CREATE POLICY "Users view own stream matches" ON public.stream_matches
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "Users create stream matches" ON public.stream_matches
  FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "Users update own stream matches" ON public.stream_matches
  FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "Users report rooms" ON public.room_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- ============================================================================
-- 7. PAYMENTS / WALLET / SUBSCRIPTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.coin_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL,
  transaction_type TEXT NOT NULL,
  description TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  transaction_id TEXT UNIQUE,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'RWF',
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  provider TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'RWF',
  status TEXT DEFAULT 'pending',
  bank_code TEXT,
  account_number TEXT,
  account_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  tier TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  amount NUMERIC,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own coin transactions" ON public.coin_transactions;
DROP POLICY IF EXISTS "Users insert own coin transactions" ON public.coin_transactions;
DROP POLICY IF EXISTS "Users view own payments" ON public.payment_transactions;
DROP POLICY IF EXISTS "Users insert own payments" ON public.payment_transactions;
DROP POLICY IF EXISTS "Users update own payments" ON public.payment_transactions;
DROP POLICY IF EXISTS "Users view own withdrawals" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Users request withdrawals" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Users view own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users insert own subscriptions" ON public.subscriptions;
CREATE POLICY "Users view own coin transactions" ON public.coin_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own coin transactions" ON public.coin_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users view own payments" ON public.payment_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own payments" ON public.payment_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own payments" ON public.payment_transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users view own withdrawals" ON public.withdrawal_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users request withdrawals" ON public.withdrawal_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users view own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 8. NOTIFICATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'system',
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT false,
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, read);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System inserts notifications" ON public.notifications;
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System inserts notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- ============================================================================
-- 9. USER SETTINGS TABLES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  device TEXT, browser TEXT, location TEXT, ip TEXT,
  last_active TIMESTAMPTZ DEFAULT NOW(),
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.connected_apps (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  app_name TEXT NOT NULL,
  app_id TEXT,
  connected_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.user_notification_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  match_notifications BOOLEAN DEFAULT true,
  message_notifications BOOLEAN DEFAULT true,
  like_notifications BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.user_privacy_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  profile_visibility TEXT DEFAULT 'public',
  show_online_status BOOLEAN DEFAULT true,
  allow_messages_from TEXT DEFAULT 'everyone',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.user_security (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_secret TEXT,
  last_password_change TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  theme TEXT DEFAULT 'light',
  language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'Africa/Kigali',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connected_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_security ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users manage own apps" ON public.connected_apps;
DROP POLICY IF EXISTS "Users manage own notif settings" ON public.user_notification_settings;
DROP POLICY IF EXISTS "Users manage own privacy" ON public.user_privacy_settings;
DROP POLICY IF EXISTS "Users manage own security" ON public.user_security;
DROP POLICY IF EXISTS "Users manage own prefs" ON public.user_preferences;
CREATE POLICY "Users manage own sessions" ON public.user_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own apps" ON public.connected_apps FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own notif settings" ON public.user_notification_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own privacy" ON public.user_privacy_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own security" ON public.user_security FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own prefs" ON public.user_preferences FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- 10. SAFETY & MODERATION
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.blocked_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  blocker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_user_id)
);
ALTER TABLE public.blocked_users
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS public.profile_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  category TEXT DEFAULT 'other',
  description TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.moderation_actions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  report_id UUID REFERENCES public.profile_reports(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  moderator_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.phone_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  country TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.safety_alerts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own blocks" ON public.blocked_users;
DROP POLICY IF EXISTS "Users create reports" ON public.profile_reports;
DROP POLICY IF EXISTS "Users view own reports" ON public.profile_reports;
DROP POLICY IF EXISTS "Users own phone history" ON public.phone_history;
DROP POLICY IF EXISTS "Users own safety alerts" ON public.safety_alerts;
CREATE POLICY "Users manage own blocks" ON public.blocked_users FOR ALL USING (auth.uid() = blocker_id OR auth.uid() = user_id);
CREATE POLICY "Users create reports" ON public.profile_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users view own reports" ON public.profile_reports FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "Users own phone history" ON public.phone_history FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own safety alerts" ON public.safety_alerts FOR ALL USING (auth.uid() = user_id);

DROP FUNCTION IF EXISTS public.block_user(UUID, UUID);
CREATE FUNCTION public.block_user(blocker UUID, blocked UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.blocked_users (blocker_id, blocked_user_id, user_id)
  VALUES (blocker, blocked, blocker)
  ON CONFLICT (blocker_id, blocked_user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.report_user(UUID, UUID, TEXT, TEXT);
CREATE FUNCTION public.report_user(reporter UUID, reported UUID, reason_in TEXT, category_in TEXT DEFAULT 'other')
RETURNS UUID AS $$
DECLARE new_id UUID;
BEGIN
  INSERT INTO public.profile_reports (reporter_id, reported_user_id, reason, category)
  VALUES (reporter, reported, reason_in, category_in)
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.delete_user_account(UUID);
CREATE FUNCTION public.delete_user_account(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  IF auth.uid() != user_uuid THEN
    RAISE EXCEPTION 'You can only delete your own account';
  END IF;
  DELETE FROM public.profiles WHERE id = user_uuid;
  DELETE FROM auth.users WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 11. VERIFICATION SYSTEM
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.verification_attempts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  attempt_number INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending',
  selfie_urls TEXT[] DEFAULT '{}',
  pose_types TEXT[] DEFAULT '{}',
  confidence_scores FLOAT[],
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS public.verified_users (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  verification_id UUID,
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  verification_level TEXT,
  badge_type TEXT DEFAULT 'verified'
);

ALTER TABLE public.verification_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verified_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users own verification attempts select" ON public.verification_attempts;
DROP POLICY IF EXISTS "Users own verification attempts insert" ON public.verification_attempts;
DROP POLICY IF EXISTS "Verified status viewable" ON public.verified_users;
CREATE POLICY "Users own verification attempts select" ON public.verification_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users own verification attempts insert" ON public.verification_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Verified status viewable" ON public.verified_users FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.can_attempt_verification(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE recent_attempts INTEGER;
BEGIN
  SELECT COUNT(*) INTO recent_attempts
  FROM public.verification_attempts
  WHERE user_id = user_uuid AND status = 'rejected'
    AND created_at > NOW() - INTERVAL '24 hours';
  RETURN recent_attempts < 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_verification_status(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'status', COALESCE(va.status, 'unverified'),
    'is_verified', COALESCE(vu.user_id IS NOT NULL, false),
    'badge_type', vu.verification_level,
    'verified_at', vu.verified_at,
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

CREATE OR REPLACE FUNCTION public.update_profile_verification(user_uuid UUID, badge_level TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET is_verified = true, verification_badge = badge_level, verified_at = NOW()
  WHERE id = user_uuid;
  INSERT INTO public.verified_users (user_id, verification_level)
  VALUES (user_uuid, badge_level)
  ON CONFLICT (user_id) DO UPDATE SET verification_level = badge_level, verified_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.revoke_verification(user_uuid UUID, reason TEXT DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles SET is_verified = false, verification_badge = NULL, verified_at = NULL WHERE id = user_uuid;
  DELETE FROM public.verified_users WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 12. REALTIME (live chat, gifts, notifications need this!)
-- ============================================================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.live_rooms;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.room_participants;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sent_gifts;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ============================================================================
-- ADMIN DASHBOARD SUPPORT
-- ============================================================================

-- Admin flag on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspension_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- Admin activity log
CREATE TABLE IF NOT EXISTS public.admin_activity_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view activity log" ON public.admin_activity_log;
DROP POLICY IF EXISTS "Admins can insert activity log" ON public.admin_activity_log;
CREATE POLICY "Admins can view activity log" ON public.admin_activity_log
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admins can insert activity log" ON public.admin_activity_log
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- Platform settings
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage settings" ON public.platform_settings;
CREATE POLICY "Admins can manage settings" ON public.platform_settings
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- Admin helper functions
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS JSONB AS $$
DECLARE stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_users', (SELECT COUNT(*) FROM public.profiles),
    'verified_users', (SELECT COUNT(*) FROM public.profiles WHERE is_verified = true),
    'premium_users', (SELECT COUNT(*) FROM public.profiles WHERE vip_tier != 'free'),
    'suspended_users', (SELECT COUNT(*) FROM public.profiles WHERE is_suspended = true),
    'pending_reports', (SELECT COUNT(*) FROM public.profile_reports WHERE status = 'pending'),
    'pending_verifications', (SELECT COUNT(*) FROM public.verification_attempts WHERE status = 'pending'),
    'active_streams', (SELECT COUNT(*) FROM public.live_rooms WHERE is_active = true),
    'pending_withdrawals', (SELECT COUNT(*) FROM public.withdrawal_requests WHERE status = 'pending')
  ) INTO stats;
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.suspend_user(user_uuid UUID, duration_days INTEGER, reason TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET is_suspended = true,
      suspension_ends_at = CASE WHEN duration_days > 0 THEN NOW() + (duration_days || ' days')::INTERVAL ELSE NULL END,
      suspension_reason = reason
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.unsuspend_user(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET is_suspended = false,
      suspension_ends_at = NULL,
      suspension_reason = NULL
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin RLS policies on existing tables
DROP POLICY IF EXISTS "Admins view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins update profiles" ON public.profiles;
CREATE POLICY "Admins view all profiles" ON public.profiles
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admins update profiles" ON public.profiles
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "Admins view all reports" ON public.profile_reports;
DROP POLICY IF EXISTS "Admins update reports" ON public.profile_reports;
CREATE POLICY "Admins view all reports" ON public.profile_reports
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admins update reports" ON public.profile_reports
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "Admins view verifications" ON public.verification_attempts;
DROP POLICY IF EXISTS "Admins update verifications" ON public.verification_attempts;
CREATE POLICY "Admins view verifications" ON public.verification_attempts
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admins update verifications" ON public.verification_attempts
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "Admins view all rooms" ON public.live_rooms;
DROP POLICY IF EXISTS "Admins update rooms" ON public.live_rooms;
CREATE POLICY "Admins view all rooms" ON public.live_rooms
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admins update rooms" ON public.live_rooms
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "Admins view payments" ON public.payment_transactions;
DROP POLICY IF EXISTS "Admins update payments" ON public.payment_transactions;
CREATE POLICY "Admins view payments" ON public.payment_transactions
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admins update payments" ON public.payment_transactions
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "Admins view withdrawals" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Admins update withdrawals" ON public.withdrawal_requests;
CREATE POLICY "Admins view withdrawals" ON public.withdrawal_requests
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admins update withdrawals" ON public.withdrawal_requests
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "Admins view all messages" ON public.messages;
CREATE POLICY "Admins view all messages" ON public.messages
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- ============================================================================
-- DONE! Verify with:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY 1;
-- ============================================================================
