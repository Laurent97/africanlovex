-- Safe RLS policies fix for existing tables
-- This migration resolves 406 (Not Acceptable) errors without dropping existing data

-- Step 1: Add missing columns to user_security table if they don't exist
DO $$
BEGIN
    -- Check and add missing columns one by one
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_security' AND column_name='two_factor_enabled') THEN
        ALTER TABLE public.user_security ADD COLUMN two_factor_enabled BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_security' AND column_name='two_factor_secret') THEN
        ALTER TABLE public.user_security ADD COLUMN two_factor_secret TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_security' AND column_name='phone_verified') THEN
        ALTER TABLE public.user_security ADD COLUMN phone_verified BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_security' AND column_name='email_verified') THEN
        ALTER TABLE public.user_security ADD COLUMN email_verified BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_security' AND column_name='last_login') THEN
        ALTER TABLE public.user_security ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_security' AND column_name='login_attempts') THEN
        ALTER TABLE public.user_security ADD COLUMN login_attempts INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_security' AND column_name='account_locked') THEN
        ALTER TABLE public.user_security ADD COLUMN account_locked BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_security' AND column_name='locked_until') THEN
        ALTER TABLE public.user_security ADD COLUMN locked_until TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_security' AND column_name='password_changed_at') THEN
        ALTER TABLE public.user_security ADD COLUMN password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_security' AND column_name='updated_at') THEN
        ALTER TABLE public.user_security ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Step 2: Ensure RLS is enabled
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_security ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can view their own security settings" ON public.user_security;
DROP POLICY IF EXISTS "Users can update their own security settings" ON public.user_security;
DROP POLICY IF EXISTS "System can insert security settings" ON public.user_security;

-- Step 4: Create comprehensive RLS policies

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON public.subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- User security policies
CREATE POLICY "Users can view their own security settings" ON public.user_security
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own security settings" ON public.user_security
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert security settings" ON public.user_security
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Step 5: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_security_user_id ON public.user_security(user_id);
CREATE INDEX IF NOT EXISTS idx_user_security_email_verified ON public.user_security(email_verified);
CREATE INDEX IF NOT EXISTS idx_user_security_phone_verified ON public.user_security(phone_verified);

-- Step 6: Ensure updated_at function exists
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create triggers for updated_at
DROP TRIGGER IF EXISTS handle_subscriptions_updated_at ON public.subscriptions;
DROP TRIGGER IF EXISTS handle_user_security_updated_at ON public.user_security;

CREATE TRIGGER handle_subscriptions_updated_at 
    BEFORE UPDATE ON public.subscriptions 
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_user_security_updated_at 
    BEFORE UPDATE ON public.user_security 
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Step 8: Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_security TO authenticated;

-- Step 9: Ensure user_security records exist for all users
INSERT INTO public.user_security (user_id)
SELECT id FROM public.profiles 
WHERE id NOT IN (SELECT user_id FROM public.user_security);

COMMIT;
