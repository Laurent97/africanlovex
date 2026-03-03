-- Live Streaming Database Tables
-- Run this script to ensure all required tables exist for the Live streaming feature

-- live_rooms table
CREATE TABLE IF NOT EXISTS live_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'entertainment',
  room_type TEXT CHECK (room_type IN ('public', 'private', 'speed_dating')) DEFAULT 'public',
  max_viewers INTEGER DEFAULT 100,
  cost_per_minute INTEGER,
  viewer_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  tags TEXT[],
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES live_rooms(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  message_type TEXT CHECK (message_type IN ('text', 'gift', 'system')) DEFAULT 'text',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- room_participants table
CREATE TABLE IF NOT EXISTS room_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES live_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  is_host BOOLEAN DEFAULT FALSE,
  is_muted BOOLEAN DEFAULT FALSE,
  is_video_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- coin_transactions table (for gift transactions)
CREATE TABLE IF NOT EXISTS coin_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT CHECK (type IN ('gift_sent', 'gift_received', 'purchase', 'refund')) NOT NULL,
  description TEXT,
  reference_id UUID, -- Can reference room_id, gift_id, etc.
  reference_type TEXT, -- 'live_room', 'gift', etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_live_rooms_host_id ON live_rooms(host_id);
CREATE INDEX IF NOT EXISTS idx_live_rooms_is_active ON live_rooms(is_active);
CREATE INDEX IF NOT EXISTS idx_live_rooms_created_at ON live_rooms(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_rooms_category ON live_rooms(category);

CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_room_created ON messages(room_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_room_participants_room_id ON room_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_user_id ON room_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_joined_at ON room_participants(joined_at DESC);

CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id ON coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_created_at ON coin_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_type ON coin_transactions(type);

-- Row Level Security (RLS) Policies
ALTER TABLE live_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;

-- Live rooms policies
CREATE POLICY "Users can view all active live rooms" ON live_rooms
  FOR SELECT USING (is_active = true);

CREATE POLICY "Hosts can manage their own rooms" ON live_rooms
  FOR ALL USING (auth.uid() = host_id);

-- Messages policies
CREATE POLICY "Users can view messages in rooms they participate in" ON messages
  FOR SELECT USING (
    room_id IN (
      SELECT room_id FROM room_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in rooms they participate in" ON messages
  FOR INSERT WITH CHECK (
    room_id IN (
      SELECT room_id FROM room_participants 
      WHERE user_id = auth.uid()
    ) AND
    sender_id = auth.uid()
  );

-- Room participants policies
CREATE POLICY "Users can view participants in rooms they participate in" ON room_participants
  FOR SELECT USING (
    room_id IN (
      SELECT room_id FROM room_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own participation" ON room_participants
  FOR ALL USING (auth.uid() = user_id);

-- Coin transactions policies
CREATE POLICY "Users can view their own transactions" ON coin_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert transactions" ON coin_transactions
  FOR INSERT WITH CHECK (true);

-- Enable real-time subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE live_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE room_participants;

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_live_rooms_updated_at BEFORE UPDATE ON live_rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_room_participants_updated_at BEFORE UPDATE ON room_participants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coin_transactions_updated_at BEFORE UPDATE ON coin_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
