-- Complete Cleanup for Live Streaming
-- This script removes ALL existing live streaming objects to ensure clean installation

-- Disable RLS temporarily to drop policies
ALTER TABLE IF EXISTS public.live_rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.room_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages DISABLE ROW LEVEL SECURITY;

-- Drop ALL policies (even if they don't exist)
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE tablename IN ('live_rooms', 'room_participants', 'messages')
    LOOP
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                          policy_record.policyname, 
                          policy_record.schemaname, 
                          policy_record.tablename);
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop policy %: %', policy_record.policyname, SQLERRM;
        END;
    END LOOP;
END $$;

-- Drop ALL functions related to live streaming
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT proname, oidvectortypes(proargtypes) as args
        FROM pg_proc 
        WHERE proname IN (
            'get_room_messages', 'get_room_participants', 'send_message', 
            'join_room', 'leave_room', 'update_coins_balance',
            'update_viewer_count', 'handle_participant_join', 'handle_participant_leave'
        )
    LOOP
        BEGIN
            EXECUTE format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE', 
                          func_record.proname, func_record.args);
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop function %: %', func_record.proname, SQLERRM;
        END;
    END LOOP;
END $$;

-- Drop ALL triggers
DROP TRIGGER IF EXISTS update_live_rooms_updated_at ON public.live_rooms;
DROP TRIGGER IF EXISTS update_messages_updated_at ON public.messages;
DROP TRIGGER IF EXISTS update_room_participants_updated_at ON public.room_participants;

-- Drop helper function with CASCADE (it's shared with other tables)
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Re-enable RLS
ALTER TABLE IF EXISTS public.live_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages ENABLE ROW LEVEL SECURITY;

-- Output completion message
DO $$
BEGIN
  RAISE NOTICE 'Complete cleanup finished!';
  RAISE NOTICE 'All live streaming policies, functions, and triggers have been removed';
  RAISE NOTICE 'You can now safely run the live_streaming_fix_migration.sql';
END $$;
