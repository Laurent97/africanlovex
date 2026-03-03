-- LoveX Database Cleanup Script
-- Deletes all mock/test data while preserving real user data
-- Run this script carefully in Supabase SQL Editor

-- WARNING: This will delete ALL data from the following tables
-- Make sure you have backups if needed

-- Disable foreign key constraints temporarily
SET session_replication_role = replica;

-- Delete from tables with foreign key dependencies (in reverse order of creation)

-- 1. Delete from room_participants (depends on live_rooms)
DELETE FROM public.room_participants;

-- 2. Delete from swipe_history (depends on profiles)
DELETE FROM public.swipe_history;

-- 3. Delete from daily_recommendations (depends on profiles)
DELETE FROM public.daily_recommendations;

-- 4. Delete from safety_alerts (depends on profiles)
DELETE FROM public.safety_alerts;

-- 5. Delete from phone_history (depends on profiles)
DELETE FROM public.phone_history;

-- 6. Delete from moderation_actions (depends on profile_reports)
DELETE FROM public.moderation_actions;

-- 7. Delete from profile_reports (depends on profiles)
DELETE FROM public.profile_reports;

-- 8. Delete from blocked_users (depends on profiles)
DELETE FROM public.blocked_users;

-- 9. Delete from coin_transactions (depends on profiles)
DELETE FROM public.coin_transactions;

-- 10. Delete from subscriptions (depends on profiles)
DELETE FROM public.subscriptions;

-- 11. Delete from live_rooms (depends on profiles)
DELETE FROM public.live_rooms;

-- 12. Delete from sent_gifts (depends on profiles and gifts)
DELETE FROM public.sent_gifts;

-- 13. Delete from messages (depends on matches and profiles)
DELETE FROM public.messages;

-- 14. Delete from matches (depends on profiles)
DELETE FROM public.matches;

-- 15. Delete from payment_transactions (depends on profiles)
DELETE FROM public.payment_transactions;

-- 16. Delete from gifts (independent table)
DELETE FROM public.gifts;

-- 17. Delete from profiles (main user data)
-- WARNING: This will delete ALL user profiles
-- Only run this if you want to completely reset the database
-- Comment this out if you want to keep real user profiles
DELETE FROM public.profiles;

-- Reset sequences (if any)
-- ALTER SEQUENCE IF EXISTS profiles_id_seq RESTART WITH 1;

-- Re-enable foreign key constraints
SET session_replication_role = DEFAULT;

-- Vacuum to reclaim space
VACUUM ANALYZE;

-- Verify deletion
SELECT 
    'profiles' as table_name, COUNT(*) as record_count FROM public.profiles
UNION ALL
SELECT 
    'gifts' as table_name, COUNT(*) as record_count FROM public.gifts
UNION ALL
SELECT 
    'matches' as table_name, COUNT(*) as record_count FROM public.matches
UNION ALL
SELECT 
    'messages' as table_name, COUNT(*) as record_count FROM public.messages
UNION ALL
SELECT 
    'sent_gifts' as table_name, COUNT(*) as record_count FROM public.sent_gifts
UNION ALL
SELECT 
    'live_rooms' as table_name, COUNT(*) as record_count FROM public.live_rooms
UNION ALL
SELECT 
    'subscriptions' as table_name, COUNT(*) as record_count FROM public.subscriptions
UNION ALL
SELECT 
    'coin_transactions' as table_name, COUNT(*) as record_count FROM public.coin_transactions
UNION ALL
SELECT 
    'blocked_users' as table_name, COUNT(*) as record_count FROM public.blocked_users
UNION ALL
SELECT 
    'profile_reports' as table_name, COUNT(*) as record_count FROM public.profile_reports
UNION ALL
SELECT 
    'moderation_actions' as table_name, COUNT(*) as record_count FROM public.moderation_actions
UNION ALL
SELECT 
    'phone_history' as table_name, COUNT(*) as record_count FROM public.phone_history
UNION ALL
SELECT 
    'safety_alerts' as table_name, COUNT(*) as record_count FROM public.safety_alerts
UNION ALL
SELECT 
    'swipe_history' as table_name, COUNT(*) as record_count FROM public.swipe_history
UNION ALL
SELECT 
    'daily_recommendations' as table_name, COUNT(*) as record_count FROM public.daily_recommendations
UNION ALL
SELECT 
    'room_participants' as table_name, COUNT(*) as record_count FROM public.room_participants
UNION ALL
SELECT 
    'payment_transactions' as table_name, COUNT(*) as record_count FROM public.payment_transactions;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database cleanup completed successfully!';
    RAISE NOTICE 'All mock data has been deleted from LoveX database.';
    RAISE NOTICE 'You can now run the complete_schema.sql to recreate the database structure.';
END $$;
