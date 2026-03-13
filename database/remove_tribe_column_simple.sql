-- Remove tribe/ethnicity column from profiles table
-- This removes the tribe field that was previously part of the signup process

-- First, drop the view that depends on tribe column
DROP VIEW IF EXISTS user_profiles_with_stats;

-- Now safely drop the tribe column
ALTER TABLE profiles DROP COLUMN IF EXISTS tribe;

-- Note: This migration drops the dependent view first, then removes the tribe column.
-- The view can be recreated later if needed, but without the tribe dependency.
-- The tribe field has been removed from the frontend signup forms and interfaces.
