-- Live Streaming Fix Migration
-- This script safely drops and recreates conflicting functions and policies

-- Drop existing functions that conflict
DROP FUNCTION IF EXISTS public.get_room_messages(UUID);
DROP FUNCTION IF EXISTS public.get_room_participants(UUID);
DROP FUNCTION IF EXISTS public.send_message(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.join_room(UUID, BOOLEAN, BOOLEAN, BOOLEAN);
DROP FUNCTION IF EXISTS public.leave_room(UUID);
DROP FUNCTION IF EXISTS public.update_coins_balance(UUID, INTEGER);

-- Drop existing policies that conflict
DROP POLICY IF EXISTS "Users can view all active live rooms" ON public.live_rooms;
DROP POLICY IF EXISTS "Hosts can view their own rooms" ON public.live_rooms;
DROP POLICY IF EXISTS "Hosts can insert their own rooms" ON public.live_rooms;
DROP POLICY IF EXISTS "Hosts can update their own rooms" ON public.live_rooms;
DROP POLICY IF EXISTS "Hosts can delete their own rooms" ON public.live_rooms;
DROP POLICY IF EXISTS "Users can view participants in rooms they are in" ON public.room_participants;
DROP POLICY IF EXISTS "Users can insert themselves as participants" ON public.room_participants;
DROP POLICY IF EXISTS "Users can update their own participant status" ON public.room_participants;
DROP POLICY IF EXISTS "Hosts can update participants in their rooms" ON public.room_participants;
DROP POLICY IF EXISTS "Users can delete their own participant records" ON public.room_participants;

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_live_rooms_updated_at ON public.live_rooms;

-- Now create the new functions (from live_streaming_functions.sql)
CREATE OR REPLACE FUNCTION get_room_messages(room_id UUID)
RETURNS TABLE (
  id UUID,
  sender_id UUID,
  content TEXT,
  message_type TEXT,
  created_at TIMESTAMPTZ,
  sender_name TEXT,
  sender_avatar TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.sender_id,
    m.content,
    m.message_type,
    m.created_at,
    COALESCE(p.full_name, p.username, 'Anonymous') as sender_name,
    p.avatar_url as sender_avatar
  FROM messages m
  LEFT JOIN profiles p ON p.id = m.sender_id
  WHERE m.room_id = $1
  ORDER BY m.created_at ASC;
END;
$$;

CREATE OR REPLACE FUNCTION get_room_participants(room_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  joined_at TIMESTAMPTZ,
  is_host BOOLEAN,
  is_muted BOOLEAN,
  is_video_enabled BOOLEAN,
  user_name TEXT,
  user_avatar TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rp.id,
    rp.user_id,
    rp.joined_at,
    rp.is_host,
    rp.is_muted,
    rp.is_video_enabled,
    COALESCE(p.full_name, p.username, 'Anonymous') as user_name,
    p.avatar_url as user_avatar
  FROM room_participants rp
  LEFT JOIN profiles p ON p.id = rp.user_id
  WHERE rp.room_id = $1
  ORDER BY rp.joined_at ASC;
END;
$$;

CREATE OR REPLACE FUNCTION send_message(
  room_id UUID,
  content TEXT,
  message_type TEXT DEFAULT 'text'
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  new_message_id UUID;
  sender_user_id UUID;
BEGIN
  -- Get the current user ID
  sender_user_id := auth.uid();
  
  -- Insert the message
  INSERT INTO messages (room_id, sender_id, content, message_type)
  VALUES (room_id, sender_user_id, content, message_type)
  RETURNING id INTO new_message_id;
  
  RETURN new_message_id;
END;
$$;

CREATE OR REPLACE FUNCTION join_room(
  room_id UUID,
  is_host BOOLEAN DEFAULT FALSE,
  is_muted BOOLEAN DEFAULT FALSE,
  is_video_enabled BOOLEAN DEFAULT TRUE
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  participant_id UUID;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  -- Check if already in room
  SELECT id INTO participant_id
  FROM room_participants
  WHERE room_id = $1 AND user_id = current_user_id;
  
  IF participant_id IS NULL THEN
    -- Insert new participant
    INSERT INTO room_participants (room_id, user_id, is_host, is_muted, is_video_enabled)
    VALUES (room_id, current_user_id, is_host, is_muted, is_video_enabled)
    RETURNING id INTO participant_id;
    
    -- Update viewer count
    UPDATE live_rooms
    SET viewer_count = viewer_count + 1
    WHERE id = room_id;
  END IF;
  
  RETURN participant_id;
END;
$$;

CREATE OR REPLACE FUNCTION leave_room(room_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  -- Delete participant
  DELETE FROM room_participants
  WHERE room_id = $1 AND user_id = current_user_id;
  
  -- Update viewer count
  UPDATE live_rooms
  SET viewer_count = viewer_count - 1
  WHERE id = room_id;
  
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION update_coins_balance(
  user_uuid UUID,
  amount_change INTEGER
) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE profiles
  SET 
    coins_balance = coins_balance + amount_change,
    updated_at = NOW()
  WHERE id = user_uuid;
  
  RETURN TRUE;
END;
$$;

-- Create new policies without circular references
CREATE POLICY "Users can view all active live rooms" ON public.live_rooms
  FOR SELECT USING (is_active = true);

CREATE POLICY "Hosts can manage their own rooms" ON public.live_rooms
  FOR ALL USING (auth.uid() = host_id);

CREATE POLICY "Users can view messages in rooms they participate in" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM room_participants 
      WHERE room_id = messages.room_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in rooms they participate in" ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM room_participants 
      WHERE room_id = room_id 
      AND user_id = auth.uid()
    ) AND
    sender_id = auth.uid()
  );

CREATE POLICY "Users can view participants in rooms they participate in" ON public.room_participants
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM live_rooms 
      WHERE id = room_participants.room_id 
      AND host_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own participation" ON public.room_participants
  FOR ALL USING (auth.uid() = user_id);

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_room_messages TO authenticated;
GRANT EXECUTE ON FUNCTION get_room_participants TO authenticated;
GRANT EXECUTE ON FUNCTION send_message TO authenticated;
GRANT EXECUTE ON FUNCTION join_room TO authenticated;
GRANT EXECUTE ON FUNCTION leave_room TO authenticated;
GRANT EXECUTE ON FUNCTION update_coins_balance TO authenticated;

-- Live Streaming Fix Migration (Run AFTER live_streaming_final_cleanup.sql)
-- This script recreates all live streaming functions and policies with proper RLS

-- Recreate the shared update_updated_at_column function (needed by other tables)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers for live streaming tables
CREATE TRIGGER update_live_rooms_updated_at
  BEFORE UPDATE ON public.live_rooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Output completion message
DO $$
BEGIN
  RAISE NOTICE 'Live streaming fix migration completed successfully!';
  RAISE NOTICE 'Conflicting functions and policies have been dropped and recreated';
  RAISE NOTICE 'Shared update_updated_at_column function has been recreated';
END $$;
