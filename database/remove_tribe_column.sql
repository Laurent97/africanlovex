-- Remove tribe/ethnicity column from profiles table
-- This removes the tribe field that was previously part of the signup process

ALTER TABLE profiles DROP COLUMN IF EXISTS tribe;

-- Note: This migration is safe to run multiple times due to IF EXISTS clause
-- The tribe field has been removed from the frontend signup forms and interfaces
