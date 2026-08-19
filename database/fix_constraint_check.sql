-- Check what constraints exist on the profiles table
SELECT constraint_name, check_clause
FROM information_schema.table_constraints 
WHERE table_name = 'profiles' 
AND table_schema = 'public';
