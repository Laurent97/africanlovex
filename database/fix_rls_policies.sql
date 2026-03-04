-- Fix RLS policies for subscriptions and user_security tables
-- This migration resolves 406 (Not Acceptable) errors

-- Step 1: Ensure tables exist and have proper structure
CREATE TABLE IF NOT EXISTS public.user_security (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret TEXT,
    phone_verified BOOLEAN DEFAULT false,
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    login_attempts INTEGER DEFAULT 0,
    account_locked BOOLEAN DEFAULT false,
    locked_until TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Enable RLS if not already enabled
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

-- Step 6: Ensure triggers exist for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS handle_subscriptions_updated_at ON public.subscriptions;
DROP TRIGGER IF EXISTS handle_user_security_updated_at ON public.user_security;

-- Create triggers
CREATE TRIGGER handle_subscriptions_updated_at 
    BEFORE UPDATE ON public.subscriptions 
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_user_security_updated_at 
    BEFORE UPDATE ON public.user_security 
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Step 7: Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_security TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Step 8: Ensure user_security records exist for all users
INSERT INTO public.user_security (user_id)
SELECT id FROM public.profiles 
WHERE id NOT IN (SELECT user_id FROM public.user_security);

COMMIT;
