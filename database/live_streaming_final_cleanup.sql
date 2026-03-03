-- Final Cleanup for Live Streaming - Remove ALL existing objects
-- This script completely removes all live streaming objects for fresh installation

-- Step 1: Disable RLS on all tables
ALTER TABLE IF EXISTS public.live_rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.room_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.coin_transactions DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL policies using system catalog
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    RAISE NOTICE 'Dropping all existing policies...';
    
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE tablename IN ('live_rooms', 'room_participants', 'messages', 'coin_transactions')
        ORDER BY tablename, policyname
    LOOP
        BEGIN
            RAISE NOTICE 'Dropping policy: % on table %', policy_record.policyname, policy_record.tablename;
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                          policy_record.policyname, 
                          policy_record.schemaname, 
                          policy_record.tablename);
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop policy %: %', policy_record.policyname, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Policy cleanup completed.';
END $$;

-- Step 3: Drop ALL functions related to live streaming
DO $$
DECLARE
    func_record RECORD;
BEGIN
    RAISE NOTICE 'Dropping all live streaming functions...';
    
    FOR func_record IN 
        SELECT proname, oidvectortypes(proargtypes) as args
        FROM pg_proc 
        WHERE proname IN (
            'get_room_messages', 'get_room_participants', 'send_message', 
            'join_room', 'leave_room', 'update_coins_balance',
            'update_viewer_count', 'handle_participant_join', 'handle_participant_leave',
            'update_updated_at_column'
        )
        ORDER BY proname
    LOOP
        BEGIN
            RAISE NOTICE 'Dropping function: %(%s)', func_record.proname, func_record.args;
            EXECUTE format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE', 
                          func_record.proname, func_record.args);
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop function %: %', func_record.proname, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Function cleanup completed.';
END $$;

-- Step 4: Drop ALL triggers
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    RAISE NOTICE 'Dropping all triggers...';
    
    FOR trigger_record IN 
        SELECT tgname, pc.relname
        FROM pg_trigger tg
        JOIN pg_class pc ON tg.tgrelid = pc.oid
        JOIN pg_namespace pn ON pc.relnamespace = pn.oid
        WHERE pn.nspname = 'public'
        AND pc.relname IN ('live_rooms', 'room_participants', 'messages', 'coin_transactions')
    LOOP
        BEGIN
            RAISE NOTICE 'Dropping trigger: % on table %', trigger_record.tgname, trigger_record.relname;
            EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', 
                          trigger_record.tgname, trigger_record.relname);
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop trigger %: %', trigger_record.tgname, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Trigger cleanup completed.';
END $$;

-- Step 5: Re-enable RLS
ALTER TABLE IF EXISTS public.live_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.coin_transactions ENABLE ROW LEVEL SECURITY;

-- Step 6: Verify cleanup
DO $$
BEGIN
    RAISE NOTICE '=== CLEANUP VERIFICATION ===';
    
    -- Check remaining policies
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename IN ('live_rooms', 'room_participants', 'messages', 'coin_transactions')) THEN
        RAISE NOTICE 'WARNING: Some policies still exist';
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE tablename IN ('live_rooms', 'room_participants', 'messages', 'coin_transactions');
    ELSE
        RAISE NOTICE '✓ All policies successfully removed';
    END IF;
    
    -- Check remaining functions
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname IN ('get_room_messages', 'get_room_participants', 'send_message', 'join_room', 'leave_room', 'update_coins_balance')) THEN
        RAISE NOTICE 'WARNING: Some functions still exist';
    ELSE
        RAISE NOTICE '✓ All functions successfully removed';
    END IF;
    
    RAISE NOTICE '=== CLEANUP COMPLETED ===';
    RAISE NOTICE 'You can now safely run the live_streaming_fix_migration.sql';
END $$;
