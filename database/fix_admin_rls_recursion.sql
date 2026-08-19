-- Fix infinite recursion in admin RLS policies
-- Run this in the Supabase SQL Editor if you see "infinite recursion detected in policy for relation \"profiles\""

-- Helper function that bypasses RLS (SECURITY DEFINER as postgres) to read admin flag
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE((
    SELECT is_admin FROM public.profiles
    WHERE id = auth.uid()
  ), false);
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

-- Re-create all admin policies using the helper instead of EXISTS subqueries

-- profiles
DROP POLICY IF EXISTS "Admins view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins update profiles" ON public.profiles;
CREATE POLICY "Admins view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin() = true);
CREATE POLICY "Admins update profiles" ON public.profiles
  FOR UPDATE USING (public.is_admin() = true);

-- admin_activity_log
DROP POLICY IF EXISTS "Admins can view activity log" ON public.admin_activity_log;
DROP POLICY IF EXISTS "Admins can insert activity log" ON public.admin_activity_log;
CREATE POLICY "Admins can view activity log" ON public.admin_activity_log
  FOR SELECT USING (public.is_admin() = true);
CREATE POLICY "Admins can insert activity log" ON public.admin_activity_log
  FOR INSERT WITH CHECK (public.is_admin() = true);

-- platform_settings
DROP POLICY IF EXISTS "Admins can manage settings" ON public.platform_settings;
CREATE POLICY "Admins can manage settings" ON public.platform_settings
  FOR ALL USING (public.is_admin() = true);

-- profile_reports
DROP POLICY IF EXISTS "Admins view all reports" ON public.profile_reports;
DROP POLICY IF EXISTS "Admins update reports" ON public.profile_reports;
CREATE POLICY "Admins view all reports" ON public.profile_reports
  FOR SELECT USING (public.is_admin() = true);
CREATE POLICY "Admins update reports" ON public.profile_reports
  FOR UPDATE USING (public.is_admin() = true);

-- verification_attempts
DROP POLICY IF EXISTS "Admins view verifications" ON public.verification_attempts;
DROP POLICY IF EXISTS "Admins update verifications" ON public.verification_attempts;
CREATE POLICY "Admins view verifications" ON public.verification_attempts
  FOR SELECT USING (public.is_admin() = true);
CREATE POLICY "Admins update verifications" ON public.verification_attempts
  FOR UPDATE USING (public.is_admin() = true);

-- live_rooms
DROP POLICY IF EXISTS "Admins view all rooms" ON public.live_rooms;
DROP POLICY IF EXISTS "Admins update rooms" ON public.live_rooms;
CREATE POLICY "Admins view all rooms" ON public.live_rooms
  FOR SELECT USING (public.is_admin() = true);
CREATE POLICY "Admins update rooms" ON public.live_rooms
  FOR UPDATE USING (public.is_admin() = true);

-- payment_transactions
DROP POLICY IF EXISTS "Admins view payments" ON public.payment_transactions;
DROP POLICY IF EXISTS "Admins update payments" ON public.payment_transactions;
CREATE POLICY "Admins view payments" ON public.payment_transactions
  FOR SELECT USING (public.is_admin() = true);
CREATE POLICY "Admins update payments" ON public.payment_transactions
  FOR UPDATE USING (public.is_admin() = true);

-- withdrawal_requests
DROP POLICY IF EXISTS "Admins view withdrawals" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Admins update withdrawals" ON public.withdrawal_requests;
CREATE POLICY "Admins view withdrawals" ON public.withdrawal_requests
  FOR SELECT USING (public.is_admin() = true);
CREATE POLICY "Admins update withdrawals" ON public.withdrawal_requests
  FOR UPDATE USING (public.is_admin() = true);

-- messages
DROP POLICY IF EXISTS "Admins view all messages" ON public.messages;
DROP POLICY IF EXISTS "Admins delete messages" ON public.messages;
CREATE POLICY "Admins view all messages" ON public.messages
  FOR SELECT USING (public.is_admin() = true);
CREATE POLICY "Admins delete messages" ON public.messages
  FOR DELETE USING (public.is_admin() = true);

-- room_participants
DROP POLICY IF EXISTS "Admins view all room participants" ON public.room_participants;
DROP POLICY IF EXISTS "Admins update room participants" ON public.room_participants;
DROP POLICY IF EXISTS "Admins delete room participants" ON public.room_participants;
CREATE POLICY "Admins view all room participants" ON public.room_participants
  FOR SELECT USING (public.is_admin() = true);
CREATE POLICY "Admins update room participants" ON public.room_participants
  FOR UPDATE USING (public.is_admin() = true);
CREATE POLICY "Admins delete room participants" ON public.room_participants
  FOR DELETE USING (public.is_admin() = true);

-- room_reports
DROP POLICY IF EXISTS "Admins view room reports" ON public.room_reports;
DROP POLICY IF EXISTS "Admins update room reports" ON public.room_reports;
CREATE POLICY "Admins view room reports" ON public.room_reports
  FOR SELECT USING (public.is_admin() = true);
CREATE POLICY "Admins update room reports" ON public.room_reports
  FOR UPDATE USING (public.is_admin() = true);
