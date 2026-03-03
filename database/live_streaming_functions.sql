-- Function to get room messages
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

-- Function to get room participants
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

-- Function to send a message
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

-- Function to join a room
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

-- Function to leave a room
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

-- Function to update coins balance
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

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_room_messages TO authenticated;
GRANT EXECUTE ON FUNCTION get_room_participants TO authenticated;
GRANT EXECUTE ON FUNCTION send_message TO authenticated;
GRANT EXECUTE ON FUNCTION join_room TO authenticated;
GRANT EXECUTE ON FUNCTION leave_room TO authenticated;
GRANT EXECUTE ON FUNCTION update_coins_balance TO authenticated;
