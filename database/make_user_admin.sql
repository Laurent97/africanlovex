-- Make the specified user an admin
UPDATE public.profiles
SET is_admin = true,
    updated_at = NOW()
WHERE id = 'e23e976f-4043-4810-9df7-01a4794d8520';

-- Verify
SELECT id, username, is_admin FROM public.profiles WHERE id = 'e23e976f-4043-4810-9df7-01a4794d8520';
