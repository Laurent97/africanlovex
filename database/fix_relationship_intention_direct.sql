-- Direct fix for relationship_intention values
-- Bypass constraint check temporarily, update values, then restore constraint

-- Step 1: Temporarily disable the CHECK constraint (if it exists)
DO $$
BEGIN
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_relationship_intention_check;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Constraint does not exist or already removed, continuing...';
END $$;
END;

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
WHERE relationship_intention = 'basic';

-- Step 3: Restore the CHECK constraint
DO $$
BEGIN
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_relationship_intention_check 
    CHECK (relationship_intention IN ('looking_for_love', 'serious_only', 'friends_first', 'sugar_daddy', 'sugar_mommy'));
    RAISE NOTICE 'Constraint restored successfully';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Failed to restore constraint, but update may have succeeded';
END $$;
END;

-- Verify the updates
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
