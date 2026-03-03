-- LoveX Chat System Migration
-- Adds conversations table and updates messages table for chat functionality

-- First, let's check what values are in the verification_level enum
DO $$
BEGIN
    RAISE NOTICE 'Checking verification_level enum values...';
END $$;

-- Option 1: Add 'golden' to the existing enum (if you want to keep it)
-- Uncomment this if you want to add 'golden' to the enum
/*
ALTER TYPE verification_level ADD VALUE IF NOT EXISTS 'golden';
*/

-- Option 2: Use existing enum values (recommended for now)
-- We'll just use the existing enum values: basic, standard, premium

-- Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL,
  last_message TEXT,
  last_message_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_sender UUID REFERENCES public.profiles(id),
  user1_unread_count INTEGER DEFAULT 0,
  user2_unread_count INTEGER DEFAULT 0,
  user1_is_typing BOOLEAN DEFAULT false,
  user2_is_typing BOOLEAN DEFAULT false,
  user1_is_online BOOLEAN DEFAULT false,
  user2_is_online BOOLEAN DEFAULT false,
  user1_last_seen TIMESTAMP WITH TIME ZONE,
  user2_last_seen TIMESTAMP WITH TIME ZONE,
  is_archived_by_user1 BOOLEAN DEFAULT false,
  is_archived_by_user2 BOOLEAN DEFAULT false,
  is_blocked_by_user1 BOOLEAN DEFAULT false,
  is_blocked_by_user2 BOOLEAN DEFAULT false,
  is_muted_by_user1 BOOLEAN DEFAULT false,
  is_muted_by_user2 BOOLEAN DEFAULT false,
  phone_call_enabled BOOLEAN DEFAULT true,
  video_call_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

-- Add conversation_id to existing messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE;

-- Add missing columns to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS read_status BOOLEAN DEFAULT false;

ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'sent' CHECK (delivery_status IN ('sending', 'sent', 'delivered', 'read'));

ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS edited BOOLEAN DEFAULT false;

ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false;

ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS reply_to UUID REFERENCES public.messages(id);

ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}';

-- Skip the verification_level constraint changes since we're using the existing enum
-- Instead, let's just check if there are any rows with 'golden' and update them
DO $$
BEGIN
    -- Check if there are any rows with verification_level = 'golden'
    IF EXISTS (SELECT 1 FROM public.profiles WHERE verification_level = 'golden'::text) THEN
        -- Update them to 'premium' since that's the highest level in our enum
        UPDATE public.profiles 
        SET verification_level = 'premium' 
        WHERE verification_level = 'golden'::text;
        
        RAISE NOTICE 'Updated golden verification_level values to premium';
    ELSE
        RAISE NOTICE 'No golden verification_level values found';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'No golden values found or column type mismatch: %', SQLERRM;
END $$;

-- Create indexes for conversations
CREATE INDEX IF NOT EXISTS idx_conversations_user1_id ON public.conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user2_id ON public.conversations(user2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_match_id ON public.conversations(match_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_time ON public.conversations(last_message_time DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations(updated_at DESC);

-- Create indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_match_id ON public.messages(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- Enable RLS for new tables
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can insert their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can delete their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;

-- RLS Policies for conversations
CREATE POLICY "Users can view their own conversations" ON public.conversations
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can insert their own conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update their own conversations" ON public.conversations
  FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can delete their own conversations" ON public.conversations
  FOR DELETE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Update existing RLS policies for messages to include conversation access
CREATE POLICY "Users can view messages in their conversations" ON public.messages
  FOR SELECT USING (
    auth.uid() = sender_id OR 
    auth.uid() = receiver_id OR
    EXISTS (
      SELECT 1 FROM public.conversations c 
      WHERE c.id = conversation_id 
      AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );

-- Function to create or get conversation between two users
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(
  user1_uuid UUID,
  user2_uuid UUID,
  match_uuid UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  conversation_id UUID;
BEGIN
  -- Try to find existing conversation
  SELECT id INTO conversation_id
  FROM public.conversations
  WHERE (user1_id = user1_uuid AND user2_id = user2_uuid)
     OR (user1_id = user2_uuid AND user2_id = user1_uuid);
  
  -- If not found, create new conversation
  IF conversation_id IS NULL THEN
    INSERT INTO public.conversations (user1_id, user2_id, match_id)
    VALUES (user1_uuid, user2_uuid, match_uuid)
    RETURNING id INTO conversation_id;
  END IF;
  
  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send a message
CREATE OR REPLACE FUNCTION public.send_message(
  conversation_uuid UUID,
  sender_uuid UUID,
  message_content TEXT,
  message_type TEXT DEFAULT 'text'
)
RETURNS UUID AS $$
DECLARE
  message_id UUID;
  receiver_uuid UUID;
  conversation_record RECORD;
BEGIN
  -- Get conversation details
  SELECT * INTO conversation_record
  FROM public.conversations
  WHERE id = conversation_uuid;
  
  -- Determine receiver
  IF conversation_record.user1_id = sender_uuid THEN
    receiver_uuid := conversation_record.user2_id;
  ELSE
    receiver_uuid := conversation_record.user1_id;
  END IF;
  
  -- Insert message
  INSERT INTO public.messages (
    conversation_id, 
    sender_id, 
    receiver_id, 
    content, 
    message_type,
    read_status,
    delivery_status
  )
  VALUES (
    conversation_uuid,
    sender_uuid,
    receiver_uuid,
    message_content,
    message_type::message_type, -- Cast to enum
    false,
    'sent'
  )
  RETURNING id INTO message_id;
  
  -- Update conversation last message
  UPDATE public.conversations
  SET 
    last_message = message_content,
    last_message_time = NOW(),
    last_message_sender = sender_uuid,
    updated_at = NOW()
  WHERE id = conversation_uuid;
  
  -- Increment unread count for receiver
  IF conversation_record.user1_id = sender_uuid THEN
    UPDATE public.conversations
    SET user2_unread_count = user2_unread_count + 1
    WHERE id = conversation_uuid;
  ELSE
    UPDATE public.conversations
    SET user1_unread_count = user1_unread_count + 1
    WHERE id = conversation_uuid;
  END IF;
  
  RETURN message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION public.mark_conversation_read(
  conversation_uuid UUID,
  user_uuid UUID
)
RETURNS VOID AS $$
DECLARE
  conversation_record RECORD;
BEGIN
  -- Get conversation details
  SELECT * INTO conversation_record
  FROM public.conversations
  WHERE id = conversation_uuid;
  
  -- Mark messages as read
  UPDATE public.messages
  SET read_status = true, delivery_status = 'read'
  WHERE conversation_id = conversation_uuid
    AND receiver_id = user_uuid
    AND read_status = false;
  
  -- Reset unread count
  IF conversation_record.user1_id = user_uuid THEN
    UPDATE public.conversations
    SET user1_unread_count = 0
    WHERE id = conversation_uuid;
  ELSE
    UPDATE public.conversations
    SET user2_unread_count = 0
    WHERE id = conversation_uuid;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user conversations with message counts
CREATE OR REPLACE FUNCTION public.get_user_conversations(
  user_uuid UUID
)
RETURNS TABLE (
  id UUID,
  participant_id UUID,
  participant_name TEXT,
  participant_age INTEGER,
  participant_location TEXT,
  participant_avatar TEXT,
  last_message TEXT,
  last_message_time TIMESTAMP WITH TIME ZONE,
  unread_count INTEGER,
  is_online BOOLEAN,
  is_verified BOOLEAN,
  verification_level TEXT,
  match_date TIMESTAMP WITH TIME ZONE,
  is_typing BOOLEAN,
  is_blocked BOOLEAN,
  is_muted BOOLEAN,
  phone_call_enabled BOOLEAN,
  video_call_enabled BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    CASE 
      WHEN c.user1_id = user_uuid THEN c.user2_id 
      ELSE c.user1_id 
    END as participant_id,
    CASE 
      WHEN c.user1_id = user_uuid THEN p2.full_name 
      ELSE p1.full_name 
    END as participant_name,
    CASE 
      WHEN c.user1_id = user_uuid THEN p2.age 
      ELSE p1.age 
    END as participant_age,
    CASE 
      WHEN c.user1_id = user_uuid THEN COALESCE(p2.city || ', ' || p2.country, p2.country)
      ELSE COALESCE(p1.city || ', ' || p1.country, p1.country)
    END as participant_location,
    CASE 
      WHEN c.user1_id = user_uuid THEN p2.avatar_url 
      ELSE p1.avatar_url 
    END as participant_avatar,
    c.last_message,
    c.last_message_time,
    CASE 
      WHEN c.user1_id = user_uuid THEN c.user1_unread_count 
      ELSE c.user2_unread_count 
    END as unread_count,
    CASE 
      WHEN c.user1_id = user_uuid THEN c.user2_is_online 
      ELSE c.user1_is_online 
    END as is_online,
    CASE 
      WHEN c.user1_id = user_uuid THEN p2.is_verified 
      ELSE p1.is_verified 
    END as is_verified,
    CASE 
      WHEN c.user1_id = user_uuid THEN p2.verification_level::text 
      ELSE p1.verification_level::text 
    END as verification_level,
    c.created_at as match_date,
    CASE 
      WHEN c.user1_id = user_uuid THEN c.user2_is_typing 
      ELSE c.user1_is_typing 
    END as is_typing,
    CASE 
      WHEN c.user1_id = user_uuid THEN c.is_blocked_by_user1 
      ELSE c.is_blocked_by_user2 
    END as is_blocked,
    CASE 
      WHEN c.user1_id = user_uuid THEN c.is_muted_by_user1 
      ELSE c.is_muted_by_user2 
    END as is_muted,
    c.phone_call_enabled,
    c.video_call_enabled
  FROM public.conversations c
  LEFT JOIN public.profiles p1 ON c.user1_id = p1.id
  LEFT JOIN public.profiles p2 ON c.user2_id = p2.id
  WHERE (c.user1_id = user_uuid OR c.user2_id = user_uuid)
    AND NOT (c.is_archived_by_user1 AND c.user1_id = user_uuid)
    AND NOT (c.is_archived_by_user2 AND c.user2_id = user_uuid)
  ORDER BY c.last_message_time DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get unread messages for a user
CREATE OR REPLACE FUNCTION public.get_unread_messages(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  content TEXT,
  created_at TIMESTAMPTZ,
  sender_id UUID,
  receiver_id UUID,
  message_type TEXT,
  read_status BOOLEAN,
  delivery_status TEXT,
  edited BOOLEAN,
  deleted BOOLEAN,
  reply_to UUID,
  reactions JSONB,
  sender JSONB,
  conversation JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.content,
    m.created_at,
    m.sender_id,
    m.receiver_id,
    m.message_type,
    m.read_status,
    m.delivery_status,
    m.edited,
    m.deleted,
    m.reply_to,
    m.reactions,
    jsonb_build_object(
      'username', p.username,
      'full_name', p.full_name,
      'avatar_url', p.avatar_url,
      'is_verified', p.is_verified,
      'vip_tier', p.vip_tier,
      'age', p.age
    ) as sender,
    jsonb_build_object(
      'id', c.id,
      'user1_id', c.user1_id,
      'user2_id', c.user2_id
    ) as conversation
  FROM messages m
  JOIN profiles p ON m.sender_id = p.id
  LEFT JOIN conversations c ON m.conversation_id = c.id
  WHERE m.receiver_id = user_uuid
    AND m.read_status = false
    AND m.deleted = false
  ORDER BY m.created_at DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark multiple messages as read
CREATE OR REPLACE FUNCTION public.mark_messages_as_read(message_ids UUID[], user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE messages 
  SET read_status = true, delivery_status = 'read'
  WHERE id = ANY(message_ids)
    AND receiver_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to conversations table
DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Chat system migration completed successfully!';
  RAISE NOTICE 'Tables created: conversations, updated messages';
  RAISE NOTICE 'Functions created: get_or_create_conversation, send_message, mark_conversation_read, get_user_conversations';
  RAISE NOTICE 'Indexes and RLS policies applied';
END $$;