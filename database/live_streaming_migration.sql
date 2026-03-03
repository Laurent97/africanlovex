-- LoveX Live Streaming Database Migration
-- Creates tables and policies for live streaming functionality

-- Create live_rooms table
CREATE TABLE IF NOT EXISTS public.live_rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  host_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  room_type TEXT DEFAULT 'public' CHECK (room_type IN ('public', 'private', 'speed_dating')),
  max_viewers INTEGER DEFAULT 100,
  cost_per_minute BIGINT DEFAULT 0,
  category TEXT DEFAULT 'entertainment',
  tags TEXT[],
  thumbnail_url TEXT,
  is_active BOOLEAN DEFAULT true,
  viewer_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create room_participants table
CREATE TABLE IF NOT EXISTS public.room_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES public.live_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_host BOOLEAN DEFAULT false,
  is_muted BOOLEAN DEFAULT false,
  is_video_enabled BOOLEAN DEFAULT true,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for live_rooms
CREATE INDEX IF NOT EXISTS idx_live_rooms_host_id ON public.live_rooms(host_id);
CREATE INDEX IF NOT EXISTS idx_live_rooms_is_active ON public.live_rooms(is_active);
CREATE INDEX IF NOT EXISTS idx_live_rooms_category ON public.live_rooms(category);
CREATE INDEX IF NOT EXISTS idx_live_rooms_created_at ON public.live_rooms(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_rooms_viewer_count ON public.live_rooms(viewer_count DESC);

-- Create indexes for room_participants
CREATE INDEX IF NOT EXISTS idx_room_participants_room_id ON public.room_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_user_id ON public.room_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_joined_at ON public.room_participants(joined_at);
CREATE INDEX IF NOT EXISTS idx_room_participants_left_at ON public.room_participants(left_at) WHERE left_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_room_participants_active ON public.room_participants(room_id, user_id) WHERE left_at IS NULL;

-- Enable RLS
ALTER TABLE public.live_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for live_rooms
CREATE POLICY "Users can view all active live rooms" ON public.live_rooms
  FOR SELECT USING (is_active = true);

CREATE POLICY "Hosts can view their own rooms" ON public.live_rooms
  FOR SELECT USING (auth.uid() = host_id);

CREATE POLICY "Hosts can insert their own rooms" ON public.live_rooms
  FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update their own rooms" ON public.live_rooms
  FOR UPDATE USING (auth.uid() = host_id);

CREATE POLICY "Hosts can delete their own rooms" ON public.live_rooms
  FOR DELETE USING (auth.uid() = host_id);

-- RLS Policies for room_participants
CREATE POLICY "Users can view participants in rooms they are in" ON public.room_participants
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.uid() IN (SELECT host_id FROM public.live_rooms WHERE id = room_id)
  );

CREATE POLICY "Users can insert themselves as participants" ON public.room_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participant status" ON public.room_participants
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Hosts can update participants in their rooms" ON public.room_participants
  FOR UPDATE USING (
    auth.uid() IN (SELECT host_id FROM public.live_rooms WHERE id = room_id)
  );

CREATE POLICY "Users can delete their own participant records" ON public.room_participants
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update viewer count
CREATE OR REPLACE FUNCTION public.update_viewer_count(room_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  viewer_count INTEGER;
BEGIN
  -- Count active participants (excluding those who left)
  SELECT COUNT(*) INTO viewer_count
  FROM public.room_participants
  WHERE room_id = room_uuid AND left_at IS NULL;
  
  -- Update the live_rooms table
  UPDATE public.live_rooms
  SET viewer_count = viewer_count,
      updated_at = NOW()
  WHERE id = room_uuid;
  
  RETURN viewer_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle participant join/leave
CREATE OR REPLACE FUNCTION public.handle_participant_join(room_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  room_exists BOOLEAN;
  is_full BOOLEAN;
  current_viewers INTEGER;
BEGIN
  -- Check if room exists and is active
  SELECT EXISTS(
    SELECT 1 FROM public.live_rooms 
    WHERE id = room_uuid AND is_active = true
  ) INTO room_exists;
  
  IF NOT room_exists THEN
    RETURN FALSE;
  END IF;
  
  -- Check if room is full
  SELECT viewer_count, max_viewers INTO current_viewers, max_viewers
  FROM public.live_rooms
  WHERE id = room_uuid;
  
  is_full := current_viewers >= max_viewers;
  
  IF is_full THEN
    RETURN FALSE;
  END IF;
  
  -- Add participant
  INSERT INTO public.room_participants (room_id, user_id)
  VALUES (room_uuid, user_uuid)
  ON CONFLICT (room_id, user_id) DO UPDATE SET
    left_at = NULL,
    joined_at = NOW();
  
  -- Update viewer count
  PERFORM public.update_viewer_count(room_uuid);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle participant leave
CREATE OR REPLACE FUNCTION public.handle_participant_leave(room_uuid UUID, user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  -- Update participant record with leave time
  UPDATE public.room_participants
  SET left_at = NOW()
  WHERE room_id = room_uuid AND user_id = user_uuid AND left_at IS NULL;
  
  -- Update viewer count
  PERFORM public.update_viewer_count(room_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to live_rooms table
CREATE TRIGGER update_live_rooms_updated_at
  BEFORE UPDATE ON public.live_rooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions
GRANT ALL ON public.live_rooms TO authenticated;
GRANT ALL ON public.room_participants TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_viewer_count TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_participant_join TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_participant_leave TO authenticated;

-- Insert sample data (optional)
INSERT INTO public.live_rooms (host_id, title, description, room_type, category, tags, thumbnail_url)
SELECT 
  p.id,
  'Sample Live Stream',
  'This is a sample live stream for testing',
  'public',
  'entertainment',
  ARRAY['music', 'chat', 'entertainment'],
  'https://images.unsplash.com/photo-1471471886143-281d93bce7e?w=400&h=300&fit=crop'
FROM public.profiles p
WHERE p.is_verified = true
LIMIT 1
ON CONFLICT DO NOTHING;

-- Output completion message
DO $$
BEGIN
  RAISE NOTICE 'Live streaming migration completed successfully!';
  RAISE NOTICE 'Tables created: live_rooms, room_participants';
  RAISE NOTICE 'Functions created: update_viewer_count, handle_participant_join, handle_participant_leave';
  RAISE NOTICE 'RLS policies applied';
  RAISE NOTICE 'Indexes created for optimal performance';
END $$;
