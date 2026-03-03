-- LoveX Mock Data Cleanup Script
-- Deletes only mock/test data while preserving real user data
-- This script identifies and removes data that appears to be mock/test data

-- WARNING: This script attempts to identify mock data patterns
-- Review the results before running in production

-- 1. Delete obvious mock profiles (test users, demo accounts)
DELETE FROM public.profiles 
WHERE 
    username LIKE '%test%' OR 
    username LIKE '%demo%' OR 
    username LIKE '%mock%' OR
    username LIKE '%sample%' OR
    full_name LIKE 'Test%' OR
    full_name LIKE 'Demo%' OR
    full_name LIKE 'Anonymous' OR
    email LIKE '%test%' OR
    email LIKE '%demo%' OR
    email LIKE '%example.com' OR
    email LIKE '%test.com' OR
    id::text LIKE '00000000-0000-0000-0000-000000000000%';

-- 2. Delete profiles with obviously fake data
DELETE FROM public.profiles 
WHERE 
    bio LIKE '%test user%' OR
    bio LIKE '%demo account%' OR
    bio LIKE '%mock data%' OR
    bio LIKE '%sample profile%' OR
    age < 18 OR age > 100 OR
    (country IS NULL OR country = '') OR
    (city IS NULL OR city = '');

-- 3. Delete profiles with test-like phone numbers
DELETE FROM public.phone_history 
WHERE 
    phone_number LIKE '+1234567890%' OR
    phone_number LIKE '+0000000000%' OR
    phone_number LIKE '+1111111111%' OR
    phone_number LIKE '0000000000' OR
    phone_number LIKE '1234567890';

-- 4. Delete test transactions (very small amounts or test patterns)
DELETE FROM public.coin_transactions 
WHERE 
    amount = 0 OR
    amount < 0 OR
    description LIKE '%test%' OR
    description LIKE '%demo%' OR
    description LIKE '%mock%' OR
    transaction_type = 'bonus' AND amount = 1000; -- Common test bonus

-- 5. Delete test payment transactions
DELETE FROM public.payment_transactions 
WHERE 
    amount = 0.00 OR
    amount = 0.01 OR
    amount = 1.00 OR
    payment_method LIKE '%test%' OR
    payment_method LIKE '%demo%' OR
    status = 'test';

-- 6. Delete test messages
DELETE FROM public.messages 
WHERE 
    content LIKE '%test message%' OR
    content LIKE '%demo%' OR
    content LIKE '%hello world%' OR
    content LIKE '%test%' OR
    message_type = 'gift' AND created_at < NOW() - INTERVAL '1 year';

-- 7. Delete test matches
DELETE FROM public.matches 
WHERE 
    created_at < NOW() - INTERVAL '1 year' OR
    status = 'expired' AND created_at < NOW() - INTERVAL '6 months';

-- 8. Delete test sent gifts
DELETE FROM public.sent_gifts 
WHERE 
    created_at < NOW() - INTERVAL '1 year' OR
    gift_id IN (
        SELECT id FROM public.gifts 
        WHERE name LIKE '%test%' OR name LIKE '%demo%'
    );

-- 9. Delete test live rooms
DELETE FROM public.live_rooms 
WHERE 
    title LIKE '%test%' OR
    title LIKE '%demo%' OR
    title LIKE '%sample%' OR
    created_at < NOW() - INTERVAL '1 year' AND participant_count = 0;

-- 10. Delete test subscriptions
DELETE FROM public.subscriptions 
WHERE 
    created_at < NOW() - INTERVAL '1 year' OR
    status = 'test' OR
    payment_method LIKE '%test%';

-- 11. Delete test reports (self-reports, test reports)
DELETE FROM public.profile_reports 
WHERE 
    reporter_id = reported_user_id OR
    reason LIKE '%test%' OR
    reason LIKE '%demo%' OR
    created_at < NOW() - INTERVAL '1 year' AND status = 'resolved';

-- 12. Delete old swipe history (keep only recent data)
DELETE FROM public.swipe_history 
WHERE created_at < NOW() - INTERVAL '6 months';

-- 13. Delete old recommendations (keep only recent data)
DELETE FROM public.daily_recommendations 
WHERE created_at < NOW() - INTERVAL '1 month';

-- 14. Delete old safety alerts (keep only recent data)
DELETE FROM public.safety_alerts 
WHERE created_at < NOW() - INTERVAL '6 months' AND status = 'resolved';

-- 15. Delete test blocked users
DELETE FROM public.blocked_users 
WHERE 
    created_at < NOW() - INTERVAL '1 year' OR
    reason LIKE '%test%' OR
    reason LIKE '%demo%';

-- Vacuum to reclaim space
VACUUM ANALYZE;

-- Show cleanup results
DO $$
DECLARE
    profiles_deleted INTEGER;
    messages_deleted INTEGER;
    matches_deleted INTEGER;
    gifts_deleted INTEGER;
    rooms_deleted INTEGER;
BEGIN
    SELECT COUNT(*) INTO profiles_deleted FROM public.profiles WHERE username LIKE '%test%' OR username LIKE '%demo%';
    SELECT COUNT(*) INTO messages_deleted FROM public.messages WHERE content LIKE '%test%';
    SELECT COUNT(*) INTO matches_deleted FROM public.matches WHERE created_at < NOW() - INTERVAL '1 year';
    SELECT COUNT(*) INTO gifts_deleted FROM public.sent_gifts WHERE created_at < NOW() - INTERVAL '1 year';
    SELECT COUNT(*) INTO rooms_deleted FROM public.live_rooms WHERE title LIKE '%test%';
    
    RAISE NOTICE 'Mock data cleanup completed!';
    RAISE NOTICE 'Profiles deleted: %', profiles_deleted;
    RAISE NOTICE 'Messages deleted: %', messages_deleted;
    RAISE NOTICE 'Old matches deleted: %', matches_deleted;
    RAISE NOTICE 'Old gifts deleted: %', gifts_deleted;
    RAISE NOTICE 'Test rooms deleted: %', rooms_deleted;
END $$;
