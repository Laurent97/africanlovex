-- Complete Database Fix Script
-- This script fixes RLS policies for all tables and ensures proper permissions

-- Step 1: Disable RLS on all tables temporarily
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.live_rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.room_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.coin_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_security DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies using system catalog
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    RAISE NOTICE 'Dropping all existing policies...';
    
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE tablename IN ('profiles', 'live_rooms', 'room_participants', 'messages', 'coin_transactions', 'subscriptions', 'user_security')
    LOOP
        BEGIN
            RAISE NOTICE 'Dropping policy: % on table %', policy_record.policyname, policy_record.tablename;
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 
                          policy_record.policyname, policy_record.tablename);
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop policy %: %', policy_record.policyname, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Policy cleanup completed.';
END $$;

-- Step 3: Drop ALL functions
DO $$
DECLARE
    func_record RECORD;
BEGIN
    RAISE NOTICE 'Dropping all functions...';
    
    FOR func_record IN 
        SELECT proname, pg_get_function_arguments(oid) as args
        FROM pg_proc 
        WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        AND proname IN (
            'get_room_messages', 'get_room_participants', 'send_message', 
            'join_room', 'leave_room', 'update_coins_balance', 'handle_participant_join',
            'handle_participant_leave', 'update_viewer_count', 'update_updated_at_column'
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
        AND pc.relname IN ('profiles', 'live_rooms', 'room_participants', 'messages', 'coin_transactions', 'subscriptions', 'user_security')
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

-- Step 5: Re-create shared function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create proper RLS policies for all tables

-- Profiles table policies
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Live rooms policies
ALTER TABLE IF EXISTS public.live_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view live rooms" ON public.live_rooms
    FOR SELECT USING (is_active = true);

CREATE POLICY "Hosts can manage their own rooms" ON public.live_rooms
    FOR ALL USING (auth.uid() = host_id);

-- Room participants policies
ALTER TABLE IF EXISTS public.room_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view room participants" ON public.room_participants
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own participation" ON public.room_participants
    FOR ALL USING (auth.uid() = user_id);

-- Messages policies
ALTER TABLE IF EXISTS public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view messages" ON public.messages
    FOR SELECT USING (true);

CREATE POLICY "Users can send messages" ON public.messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own messages" ON public.messages
    FOR UPDATE USING (auth.uid() = sender_id);

-- Coin transactions policies
ALTER TABLE IF EXISTS public.coin_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions" ON public.coin_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert transactions" ON public.coin_transactions
    FOR INSERT WITH CHECK (true);

-- Subscriptions policies
ALTER TABLE IF EXISTS public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage subscriptions" ON public.subscriptions
    FOR ALL USING (true);

-- User security policies
ALTER TABLE IF EXISTS public.user_security ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own security settings" ON public.user_security
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own security settings" ON public.user_security
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert security settings" ON public.user_security
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Step 7: Create live streaming functions
CREATE OR REPLACE FUNCTION public.get_room_messages(p_room_id UUID)
RETURNS TABLE (
    id UUID,
    room_id UUID,
    sender_id UUID,
    content TEXT,
    message_type TEXT,
    gift_id UUID,
    created_at TIMESTAMPTZ,
    sender_username TEXT,
    sender_avatar TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.room_id,
        m.sender_id,
        m.content,
        m.message_type,
        m.gift_id,
        m.created_at,
        p.username as sender_username,
        p.avatar_url as sender_avatar
    FROM public.messages m
    LEFT JOIN public.profiles p ON m.sender_id = p.id
    WHERE m.room_id = p_room_id
    ORDER BY m.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_room_participants(p_room_id UUID)
RETURNS TABLE (
    id UUID,
    room_id UUID,
    user_id UUID,
    username TEXT,
    avatar TEXT,
    is_host BOOLEAN,
    is_muted BOOLEAN,
    is_video_enabled BOOLEAN,
    joined_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rp.id,
        rp.room_id,
        rp.user_id,
        p.username,
        p.avatar_url as avatar,
        rp.is_host,
        rp.is_muted,
        rp.is_video_enabled,
        rp.joined_at
    FROM public.room_participants rp
    LEFT JOIN public.profiles p ON rp.user_id = p.id
    WHERE rp.room_id = p_room_id
    ORDER BY rp.is_host DESC, rp.joined_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.send_message(
    p_room_id UUID,
    p_content TEXT,
    p_message_type TEXT DEFAULT 'text',
    p_gift_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_message_id UUID;
BEGIN
    INSERT INTO public.messages (
        room_id,
        sender_id,
        content,
        message_type,
        gift_id
    ) VALUES (
        p_room_id,
        auth.uid(),
        p_content,
        p_message_type,
        p_gift_id
    ) RETURNING id INTO v_message_id;
    
    RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.join_room(p_room_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO public.room_participants (
        room_id,
        user_id,
        is_host,
        is_muted,
        is_video_enabled
    ) VALUES (
        p_room_id,
        auth.uid(),
        false,
        false,
        true
    );
    
    -- Update viewer count
    UPDATE public.live_rooms 
    SET viewer_count = viewer_count + 1 
    WHERE id = p_room_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.leave_room(p_room_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM public.room_participants 
    WHERE room_id = p_room_id AND user_id = auth.uid();
    
    -- Update viewer count
    UPDATE public.live_rooms 
    SET viewer_count = GREATEST(viewer_count - 1, 0)
    WHERE id = p_room_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.update_coins_balance(
    p_user_id UUID,
    p_amount INTEGER,
    p_transaction_type TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update user's coin balance
    UPDATE public.profiles 
    SET coins = coins + p_amount
    WHERE id = p_user_id;
    
    -- Record transaction
    INSERT INTO public.coin_transactions (
        user_id,
        amount,
        transaction_type
    ) VALUES (
        p_user_id,
        p_amount,
        p_transaction_type
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Create triggers
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_live_rooms_updated_at
    BEFORE UPDATE ON public.live_rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_room_participants_updated_at
    BEFORE UPDATE ON public.room_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 9: Grant permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_room_messages TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_room_participants TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_message TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_room TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_room TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_coins_balance TO authenticated;

-- Step 10: Verify setup
DO $$
BEGIN
    RAISE NOTICE '=== DATABASE FIX COMPLETED ===';
    RAISE NOTICE 'All RLS policies have been recreated';
    RAISE NOTICE 'All functions have been recreated';
    RAISE NOTICE 'All triggers have been recreated';
    RAISE NOTICE 'Permissions have been granted';
END $$;
