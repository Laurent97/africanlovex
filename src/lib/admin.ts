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
