-- Fix relationship_intention values in profiles table
-- Update incorrect 'basic' values to proper relationship intentions

-- Update the incorrect values to proper ones
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
