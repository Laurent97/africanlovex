import { supabase } from './supabase';

export interface AdminStats {
  total_users: number;
  verified_users: number;
  premium_users: number;
  suspended_users: number;
  pending_reports: number;
  pending_verifications: number;
  active_streams: number;
  pending_withdrawals: number;
}

export interface AdminUser {
  id: string;
  full_name?: string | null;
  username?: string;
  country?: string | null;
  vip_tier?: string;
  is_verified?: boolean;
  is_suspended?: boolean;
  is_admin?: boolean;
  created_at?: string;
  email?: string;
}

export interface GetUsersParams {
  page?: number;
  perPage?: number;
  search?: string;
  status?: 'all' | 'active' | 'suspended';
  vipTier?: 'all' | 'free' | 'premium';
}

export interface GetUsersResult {
  data: AdminUser[];
  count: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  const { data, error } = await (supabase as any).rpc('get_admin_stats');
  if (error) throw error;
  return (data as unknown as AdminStats) ?? {
    total_users: 0,
    verified_users: 0,
    premium_users: 0,
    suspended_users: 0,
    pending_reports: 0,
    pending_verifications: 0,
    active_streams: 0,
    pending_withdrawals: 0,
  };
}

export async function getUsers(params: GetUsersParams = {}): Promise<GetUsersResult> {
  const {
    page = 1,
    perPage = 10,
    search = '',
    status = 'all',
    vipTier = 'all',
  } = params;

  let query = (supabase as any).from('profiles').select('*', { count: 'exact' });

  const term = search.trim();
  if (term) {
    query = query.or(`full_name.ilike.%${term}%,username.ilike.%${term}%`);
  }

  if (status === 'active') {
    query = query.eq('is_suspended', false);
  } else if (status === 'suspended') {
    query = query.eq('is_suspended', true);
  }

  if (vipTier === 'free') {
    query = query.eq('vip_tier', 'free');
  } else if (vipTier === 'premium') {
    query = query.neq('vip_tier', 'free');
  }

  const start = (page - 1) * perPage;
  const { data, error, count } = await query
    .range(start, start + perPage - 1)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return {
    data: (data ?? []) as AdminUser[],
    count: count ?? 0,
  };
}

export async function toggleAdmin(userId: string, isAdmin: boolean): Promise<void> {
  const { error } = await (supabase as any)
    .from('profiles')
    .update({ is_admin: isAdmin })
    .eq('id', userId);
  if (error) throw error;
}

export async function toggleSuspension(
  userId: string,
  action: 'suspend' | 'unsuspend',
  durationDays?: number,
  reason?: string
): Promise<void> {
  if (action === 'suspend') {
    const { error } = await (supabase as any).rpc('suspend_user', {
      user_uuid: userId,
      duration_days: durationDays ?? 0,
      reason: reason ?? '',
    });
    if (error) throw error;
  } else {
    const { error } = await (supabase as any).rpc('unsuspend_user', {
      user_uuid: userId,
    });
    if (error) throw error;
  }
}

export async function logAdminAction(
  action: string,
  targetType: string,
  targetId?: string,
  details: Record<string, any> = {}
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await (supabase as any).from('admin_activity_log').insert({
    admin_id: user.id,
    action,
    target_type: targetType,
    target_id: targetId ?? null,
    details,
  });

  if (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to log admin action:', error);
  }
}

export interface AdminReport {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  reason: string;
  category: string;
  description: string;
  evidence: string[] | null;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  created_at: string;
  updated_at: string;
  reporter_profile?: { username?: string | null; full_name?: string | null; avatar_url?: string | null } | null;
  reported_profile?: { username?: string | null; full_name?: string | null; avatar_url?: string | null; country?: string | null } | null;
}

export interface GetReportsParams {
  status?: 'all' | 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  page?: number;
  perPage?: number;
}

export interface GetReportsResult {
  data: AdminReport[];
  count: number;
}

export async function getReports(params: GetReportsParams = {}): Promise<GetReportsResult> {
  const { status = 'all', page = 1, perPage = 10 } = params;

  let query = (supabase as any)
    .from('profile_reports')
    .select(
      `*,
      reporter_profile:profiles!profile_reports_reporter_id_fkey(username, full_name, avatar_url),
      reported_profile:profiles!profile_reports_reported_user_id_fkey(username, full_name, avatar_url, country)`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false });

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  const start = (page - 1) * perPage;
  const { data, error, count } = await query.range(start, start + perPage - 1);

  if (error) throw error;

  return {
    data: (data ?? []) as AdminReport[],
    count: count ?? 0,
  };
}

export async function getReportDetails(id: string): Promise<AdminReport> {
  const { data, error } = await (supabase as any)
    .from('profile_reports')
    .select(
      `*,
      reporter_profile:profiles!profile_reports_reporter_id_fkey(*),
      reported_profile:profiles!profile_reports_reported_user_id_fkey(*)`
    )
    .eq('id', id)
    .single();

  if (error) throw error;
  if (!data) throw new Error('Report not found');
  return data as AdminReport;
}

export async function updateReportStatus(
  id: string,
  status: 'resolved' | 'dismissed',
  notes?: string
): Promise<void> {
  const { error } = await (supabase as any)
    .from('profile_reports')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;

  await logAdminAction('Update report status', 'report', id, { status, notes });
}

export interface VerificationAttempt {
  id: string;
  user_id: string;
  attempt_number: number;
  status: 'pending' | 'approved' | 'rejected';
  selfie_urls: string[] | null;
  pose_types: string[] | null;
  confidence_scores: number[] | null;
  rejection_reason: string | null;
  created_at: string;
  completed_at: string | null;
  profile?: { username?: string | null; full_name?: string | null; avatar_url?: string | null } | null;
}

export interface GetVerificationAttemptsParams {
  status?: 'all' | 'pending' | 'approved' | 'rejected';
  page?: number;
  perPage?: number;
}

export interface GetVerificationAttemptsResult {
  data: VerificationAttempt[];
  count: number;
}

export async function getVerificationAttempts(
  params: GetVerificationAttemptsParams = {}
): Promise<GetVerificationAttemptsResult> {
  const { status = 'all', page = 1, perPage = 10 } = params;

  let query = (supabase as any)
    .from('verification_attempts')
    .select(
      `*,
      profile:profiles!verification_attempts_user_id_fkey(username, full_name, avatar_url)`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false });

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  const start = (page - 1) * perPage;
  const { data, error, count } = await query.range(start, start + perPage - 1);

  if (error) throw error;

  return {
    data: (data ?? []) as VerificationAttempt[],
    count: count ?? 0,
  };
}

export async function approveVerification(id: string): Promise<void> {
  const { data: attempt, error: fetchError } = await (supabase as any)
    .from('verification_attempts')
    .select('user_id')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;
  if (!attempt?.user_id) throw new Error('Verification attempt not found');

  const now = new Date().toISOString();

  const { error: updateError } = await (supabase as any)
    .from('verification_attempts')
    .update({ status: 'approved', completed_at: now })
    .eq('id', id);

  if (updateError) throw updateError;

  const { error: profileError } = await (supabase as any)
    .from('profiles')
    .update({ is_verified: true, verification_level: 'basic', updated_at: now })
    .eq('id', attempt.user_id);

  if (profileError) throw profileError;

  await logAdminAction('Approve verification', 'verification', id, { user_id: attempt.user_id });
}

export async function rejectVerification(id: string, reason: string): Promise<void> {
  const { data: attempt, error: fetchError } = await (supabase as any)
    .from('verification_attempts')
    .select('user_id')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;
  if (!attempt?.user_id) throw new Error('Verification attempt not found');

  const now = new Date().toISOString();

  const { error } = await (supabase as any)
    .from('verification_attempts')
    .update({ status: 'rejected', rejection_reason: reason, completed_at: now })
    .eq('id', id);

  if (error) throw error;

  await logAdminAction('Reject verification', 'verification', id, { user_id: attempt.user_id, reason });
}
