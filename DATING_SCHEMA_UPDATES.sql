-- Dating-focused schema updates for live streaming feature
-- Run these SQL commands in your Supabase database

-- Add dating-specific fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS dating_preferences JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS relationship_goals TEXT DEFAULT 'casual',
ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS looking_for_age_min INTEGER DEFAULT 18,
ADD COLUMN IF NOT EXISTS looking_for_age_max INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS gender_preferences TEXT[] DEFAULT '{}';

-- Add dating-specific fields to live_rooms table
ALTER TABLE live_rooms 
ADD COLUMN IF NOT EXISTS dating_focus TEXT DEFAULT 'casual',
ADD COLUMN IF NOT EXISTS min_age_preference INTEGER,
ADD COLUMN IF NOT EXISTS max_age_preference INTEGER,
ADD COLUMN IF NOT EXISTS gender_preference TEXT[];

-- Create stream_matches table for tracking dating connections
CREATE TABLE IF NOT EXISTS stream_matches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    stream_id UUID REFERENCES live_rooms(id) ON DELETE CASCADE,
    user1_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    user2_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'matched')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(stream_id, user1_id, user2_id)
);

-- Fix message_type enum constraint issue
-- The column is likely an ENUM type, so we need to modify the ENUM itself

-- First, check if message_type is an ENUM type and modify it
DO $$ 
BEGIN
    -- Drop any existing CHECK constraints first
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'messages' 
        AND constraint_name LIKE '%message_type%'
    ) THEN
        ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_message_type_check;
        ALTER TABLE messages DROP CONSTRAINT IF EXISTS check_message_type;
    END IF;
    
    -- Check if message_type column exists and is an ENUM type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' 
        AND column_name = 'message_type'
        AND data_type = 'USER-DEFINED'
    ) THEN
        -- For ENUM types, we need to alter the type itself
        -- This approach varies by PostgreSQL version, so we'll use a safer method
        -- Convert to TEXT first, then add CHECK constraint
        ALTER TABLE messages ALTER COLUMN message_type TYPE TEXT;
    END IF;
    
    -- If column doesn't exist or is now TEXT, ensure it has the right constraints
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' 
        AND column_name = 'message_type'
    ) THEN
        -- Add the column if it doesn't exist
        ALTER TABLE messages ADD COLUMN message_type TEXT DEFAULT 'text';
    END IF;
END $$;

-- Add the complete message type constraint
ALTER TABLE messages 
ADD CONSTRAINT IF NOT EXISTS messages_message_type_check 
CHECK (message_type IN ('text', 'gift', 'system', 'dating_interest', 'join', 'leave'));

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_stream_matches_status ON stream_matches(status);
CREATE INDEX IF NOT EXISTS idx_stream_matches_users ON stream_matches(user1_id, user2_id);
CREATE INDEX IF NOT EXISTS idx_live_rooms_dating_focus ON live_rooms(dating_focus);
CREATE INDEX IF NOT EXISTS idx_profiles_dating_preferences ON profiles USING GIN(dating_preferences);

-- Add RLS (Row Level Security) policies for stream_matches
ALTER TABLE stream_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own matches" ON stream_matches
    FOR SELECT USING (
        auth.uid() = user1_id OR 
        auth.uid() = user2_id
    );

CREATE POLICY "Users can insert their own matches" ON stream_matches
    FOR INSERT WITH CHECK (
        auth.uid() = user1_id OR 
        auth.uid() = user2_id
    );

CREATE POLICY "Users can update their own matches" ON stream_matches
    FOR UPDATE USING (
        auth.uid() = user1_id OR 
        auth.uid() = user2_id
    );

-- Add dating-specific gift suggestions to gifts table
INSERT INTO gifts (name, name_local, description, tier, cost_coins, icon_url, is_active) VALUES
('Virtual Rose', 'Virtual Rose', 'A beautiful virtual rose to show your interest', 'romantic', 10, '🌹', true),
('Love Letter', 'Love Letter', 'Send a heartfelt virtual love letter', 'romantic', 15, '💌', true),
('Virtual Coffee Date', 'Virtual Coffee Date', 'Invite someone for a virtual coffee date', 'real_world', 50, '☕', true),
('Engagement Ring', 'Engagement Ring', 'A virtual engagement ring for serious commitment', 'serious', 100, '💍', true),
('Wedding Bells', 'Wedding Bells', 'Celebrate your love with wedding bells', 'legendary', 200, '🔔', true),
('Box of Chocolates', 'Box of Chocolates', 'Sweet treats for your sweet someone', 'romantic', 25, '🍫', true),
('Romantic Dinner', 'Romantic Dinner', 'A virtual romantic dinner experience', 'real_world', 75, '🍷', true),
('Promise Ring', 'Promise Ring', 'A promise of future commitment', 'serious', 60, '💫', true),
('Love Song', 'Love Song', 'Dedicate a virtual love song', 'romantic', 20, '🎵', true),
('Candlelight Dinner', 'Candlelight Dinner', 'Intimate candlelight dinner experience', 'real_world', 80, '🕯️', true)
ON CONFLICT DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for stream_matches updated_at
CREATE TRIGGER update_stream_matches_updated_at 
    BEFORE UPDATE ON stream_matches 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add sample dating-focused categories
UPDATE live_rooms 
SET category = 'icebreakers' 
WHERE category IN ('entertainment', 'lifestyle') 
AND id IN (
    SELECT id FROM live_rooms 
    WHERE is_active = true 
    LIMIT 5
);
