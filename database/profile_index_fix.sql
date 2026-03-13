-- Add index for faster profile lookups
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);

-- This index should already exist from the dashboard optimization,
-- but ensuring it exists for profile fetch performance
