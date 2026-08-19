-- Comprehensive fix for relationship_intention values
-- This script handles the constraint properly and ensures the fix works

-- Step 1: Drop the constraint if it exists
DO $$
BEGIN
    -- Drop the constraint if it exists
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_relationship_intention_check;
EXCEPTION
    -- Handle case where constraint doesn't exist
    WHEN OTHERS THEN
        RAISE NOTICE 'Constraint does not exist, continuing...';
END $$;

-- Step 2: Update the incorrect 'basic' values to proper relationship intentions
UPDATE public.profiles 
SET relationship_intention = CASE 
  WHEN relationship_intention = 'basic' AND username LIKE '%marie%' THEN 'looking_for_love'
  WHEN relationship_intention = 'basic' AND username LIKE '%kizzo%' THEN 'serious_only'
  WHEN relationship_intention = 'basic' AND username LIKE '%umwari%' THEN 'friends_first'
  WHEN relationship_intention = 'basic' AND username LIKE '%gahigi%' THEN 'friends_first'
  WHEN relationship_intention = 'basic' AND username LIKE '%mukiza%' THEN 'looking_for_love'
  WHEN relationship_intention = 'basic' AND username LIKE '%test123%' THEN 'serious_only'
  WHEN relationship_intention = 'basic' AND username = 'laurentjean535@gmail.com' THEN 'looking_for_love'
  ELSE relationship_intention
END
WHERE relationship_intention IN ('basic', 'looking_for_love', 'serious_only', 'friends_first');

-- Step 3: Re-add the CHECK constraint only if it doesn't exist
DO $$
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_relationship_intention_check'
        AND table_name = 'profiles'
        AND table_schema = 'public'
    ) THEN
        -- Add the constraint
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_relationship_intention_check 
        CHECK (relationship_intention IN ('looking_for_love', 'serious_only', 'friends_first', 'sugar_daddy', 'sugar_mommy'));
        RAISE NOTICE 'Constraint added successfully';
    ELSE
        RAISE NOTICE 'Constraint already exists, skipping...';
    END IF;
END $$;

-- Step 4: Verify the updates
SELECT id, username, relationship_intention, 
       CASE 
         WHEN relationship_intention = 'basic' AND username LIKE '%marie%' THEN 'FIXED - looking_for_love'
         WHEN relationship_intention = 'basic' AND username LIKE '%kizzo%' THEN 'FIXED - serious_only'
         WHEN relationship_intention = 'basic' AND username LIKE '%umwari%' THEN 'FIXED - friends_first'
         ELSE relationship_intention
       END as status_change
FROM public.profiles 
WHERE relationship_intention IN ('basic', 'looking_for_love', 'serious_only', 'friends_first')
LIMIT 10;
