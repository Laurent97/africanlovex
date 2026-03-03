-- Profile Photos Table Migration
-- Add proper photo support with one-to-many relationship

-- Create profile_photos table for multiple profile photos
CREATE TABLE IF NOT EXISTS public.profile_photos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  is_main BOOLEAN DEFAULT FALSE,
  photo_position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profile_photos ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own photos"
  ON public.profile_photos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own photos"
  ON public.profile_photos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own photos"
  ON public.profile_photos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own photos"
  ON public.profile_photos FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profile_photos_user_id ON public.profile_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_photos_position ON public.profile_photos(photo_position);
CREATE INDEX IF NOT EXISTS idx_profile_photos_main ON public.profile_photos(is_main);

-- Apply updated_at trigger
CREATE TRIGGER handle_profile_photos_updated_at 
  BEFORE UPDATE ON public.profile_photos 
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to get user photos with proper ordering
CREATE OR REPLACE FUNCTION public.get_user_photos(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  photo_url TEXT,
  is_main BOOLEAN,
  photo_position INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pp.id,
    pp.photo_url,
    pp.is_main,
    pp.photo_position,
    pp.created_at
  FROM public.profile_photos pp
  WHERE pp.user_id = user_uuid
  ORDER BY 
    pp.is_main DESC,
    pp.photo_position ASC,
    pp.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add a new photo
CREATE OR REPLACE FUNCTION public.add_profile_photo(
  user_uuid UUID,
  photo_url TEXT,
  is_main BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
  new_photo_id UUID;
  max_position INTEGER;
BEGIN
  -- Get the next position
  SELECT COALESCE(MAX(photo_position), -1) + 1 INTO max_position
  FROM public.profile_photos
  WHERE user_id = user_uuid;
  
  -- If this is the first photo or explicitly set as main, make it main
  IF max_position = 0 OR is_main THEN
    -- Unset all existing main photos
    UPDATE public.profile_photos
    SET is_main = FALSE
    WHERE user_id = user_uuid;
    
    is_main := TRUE;
  END IF;
  
  -- Insert the new photo
  INSERT INTO public.profile_photos (user_id, photo_url, is_main, photo_position)
  VALUES (user_uuid, photo_url, is_main, max_position)
  RETURNING id INTO new_photo_id;
  
  RETURN new_photo_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set main photo
CREATE OR REPLACE FUNCTION public.set_main_photo(user_uuid UUID, photo_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- First, unset all main photos for this user
  UPDATE public.profile_photos
  SET is_main = FALSE
  WHERE user_id = user_uuid;
  
  -- Then set the new main photo
  UPDATE public.profile_photos
  SET is_main = TRUE
  WHERE id = photo_id AND user_id = user_uuid;
  
  -- Check if the update was successful
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete a photo
CREATE OR REPLACE FUNCTION public.delete_profile_photo(user_uuid UUID, photo_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  was_main BOOLEAN;
BEGIN
  -- Check if the photo being deleted is main
  SELECT is_main INTO was_main
  FROM public.profile_photos
  WHERE id = photo_id AND user_id = user_uuid;
  
  -- Delete the photo
  DELETE FROM public.profile_photos
  WHERE id = photo_id AND user_id = user_uuid;
  
  -- If we deleted the main photo and there are other photos, set the first one as main
  IF was_main THEN
    UPDATE public.profile_photos
    SET is_main = TRUE
    WHERE id = (
      SELECT id FROM public.profile_photos
      WHERE user_id = user_uuid
      ORDER BY photo_position ASC, created_at ASC
      LIMIT 1
    );
  END IF;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reorder photos
CREATE OR REPLACE FUNCTION public.reorder_photos(user_uuid UUID, photo_ids UUID[])
RETURNS BOOLEAN AS $$
BEGIN
  -- Update positions for all photos
  FOR i IN 1..array_length(photo_ids, 1) LOOP
    UPDATE public.profile_photos
    SET photo_position = i - 1
    WHERE id = photo_ids[i] AND user_id = user_uuid;
  END LOOP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get photo count
CREATE OR REPLACE FUNCTION public.get_photo_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) 
    FROM public.profile_photos 
    WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
