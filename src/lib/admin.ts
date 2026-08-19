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

export interface LiveRoom {
  id: string;
  host_id: string;
  title: string;
  host_name?: string | null;
  is_active: boolean;
  started_at?: string | null;
  viewer_count?: number;
  created_at?: string;
  host?: { username?: string | null; full_name?: string | null } | null;
}

export interface RoomParticipant {
  id: string;
  room_id: string;
  user_id: string;
  role?: string;
  is_host?: boolean;
  is_muted?: boolean;
  joined_at?: string;
  left_at?: string | null;
  user?: { username?: string | null; full_name?: string | null } | null;
}

export interface RoomReport {
  id: string;
  room_id: string;
  reporter_id: string;
  reason: string;
  created_at: string;
  reporter?: { username?: string | null; full_name?: string | null } | null;
}

export interface AdminMessage {
  id: string;
  content: string;
  message_type: string;
  created_at: string;
  sender_id?: string | null;
  receiver_id?: string | null;
  conversation_id?: string | null;
  room_id?: string | null;
  sender?: { username?: string | null; full_name?: string | null } | null;
  room?: { title?: string | null } | null;
}

export interface GetMessagesParams {
  messageType?: string;
  search?: string;
  page?: number;
  perPage?: number;
}

export interface GetMessagesResult {
  data: AdminMessage[];
  count: number;
}

export interface GetLiveRoomsResult {
  data: LiveRoom[];
  count: number;
}

export async function getLiveRooms(params: { active?: boolean } = {}): Promise<GetLiveRoomsResult> {
  let query = (supabase as any)
    .from('live_rooms')
    .select('*, host:profiles!left(username, full_name)', { count: 'exact' })
    .order('started_at', { ascending: false });

  if (params.active === true) {
    query = query.eq('is_active', true);
  } else if (params.active === false) {
    query = query.eq('is_active', false);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    data: (data ?? []) as LiveRoom[],
    count: count ?? 0,
  };
}

export async function getRoomParticipants(roomId: string): Promise<RoomParticipant[]> {
  const { data, error } = await (supabase as any)
    .from('room_participants')
    .select('*, user:profiles!user_id(username, full_name)')
    .eq('room_id', roomId)
    .is('left_at', null)
    .order('joined_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as RoomParticipant[];
}

export async function terminateRoom(roomId: string): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await (supabase as any)
    .from('live_rooms')
    .update({ is_active: false, ended_at: now })
    .eq('id', roomId);

  if (error) throw error;
  await logAdminAction('Terminate room', 'live_room', roomId, { ended_at: now });
}

export async function removeParticipant(roomId: string, userId: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('room_participants')
    .delete()
    .eq('room_id', roomId)
    .eq('user_id', userId);

  if (error) throw error;
  await logAdminAction('Remove room participant', 'room_participant', roomId, { user_id: userId });
}

export async function getRoomReports(roomId: string): Promise<RoomReport[]> {
  const { data, error } = await (supabase as any)
    .from('room_reports')
    .select('*, reporter:profiles!reporter_id(username, full_name)')
    .eq('room_id', roomId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as RoomReport[];
}

export async function getMessages(params: GetMessagesParams = {}): Promise<GetMessagesResult> {
  const { messageType = '', search = '', page = 1, perPage = 20 } = params;

  let query = (supabase as any)
    .from('messages')
    .select(
      `*,
      sender:profiles!sender_id(username, full_name),
      room:live_rooms!left(title)`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false });

  if (messageType) {
    query = query.eq('message_type', messageType);
  }

  if (search.trim()) {
    query = query.ilike('content', `%${search.trim()}%`);
  }

  const start = (page - 1) * perPage;
  const { data, error, count } = await query.range(start, start + perPage - 1);

  if (error) throw error;

  return {
    data: (data ?? []) as AdminMessage[],
    count: count ?? 0,
  };
}

export async function deleteMessage(id: string): Promise<void> {
  const { error } = await (supabase as any).from('messages').delete().eq('id', id);
  if (error) throw error;
  await logAdminAction('Delete message', 'message', id, {});
}

export interface AdminPaymentTransaction {
  id: string;
  user_id: string;
  transaction_id?: string | null;
  amount: number;
  currency: string;
  status: string;
  payment_method?: string | null;
  provider?: string | null;
  metadata?: Record<string, any> | null;
  created_at: string;
  updated_at?: string | null;
  user?: { username?: string | null; full_name?: string | null } | null;
}

export interface GetPaymentTransactionsParams {
  status?: 'all' | 'pending' | 'completed' | 'failed' | 'refunded';
  page?: number;
  perPage?: number;
}

export interface GetPaymentTransactionsResult {
  data: AdminPaymentTransaction[];
  count: number;
}

export async function getPaymentTransactions(
  params: GetPaymentTransactionsParams = {}
): Promise<GetPaymentTransactionsResult> {
  const { status = 'all', page = 1, perPage = 10 } = params;

  let query = (supabase as any)
    .from('payment_transactions')
    .select(
      `*,
      user:profiles!payment_transactions_user_id_fkey(username, full_name)`,
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
    data: (data ?? []) as AdminPaymentTransaction[],
    count: count ?? 0,
  };
}

export interface AdminWithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected';
  bank_code?: string | null;
  account_number?: string | null;
  account_name?: string | null;
  created_at: string;
  processed_at?: string | null;
  user?: { username?: string | null; full_name?: string | null } | null;
}

export interface GetWithdrawalRequestsParams {
  status?: 'all' | 'pending' | 'approved' | 'rejected';
  page?: number;
  perPage?: number;
}

export interface GetWithdrawalRequestsResult {
  data: AdminWithdrawalRequest[];
  count: number;
}

export async function getWithdrawalRequests(
  params: GetWithdrawalRequestsParams = {}
): Promise<GetWithdrawalRequestsResult> {
  const { status = 'all', page = 1, perPage = 10 } = params;

  let query = (supabase as any)
    .from('withdrawal_requests')
    .select(
      `*,
      user:profiles!withdrawal_requests_user_id_fkey(username, full_name)`,
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
    data: (data ?? []) as AdminWithdrawalRequest[],
    count: count ?? 0,
  };
}

export async function updateWithdrawalRequest(
  id: string,
  status: 'approved' | 'rejected',
  notes?: string
): Promise<void> {
  const now = new Date().toISOString();
  const update: Record<string, any> = { status, updated_at: now };
  if (status === 'approved' || status === 'rejected') {
    update.processed_at = now;
  }

  const { error } = await (supabase as any)
    .from('withdrawal_requests')
    .update(update)
    .eq('id', id);

  if (error) throw error;

  await logAdminAction('Update withdrawal request', 'withdrawal_request', id, { status, notes });
}

export interface AdminGift {
  id: string;
  name: string;
  name_local?: string | null;
  description?: string | null;
  tier?: string | null;
  cost_coins: number;
  icon_url?: string | null;
  animation_url?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface GetGiftsParams {
  page?: number;
  perPage?: number;
}

export interface GetGiftsResult {
  data: AdminGift[];
  count: number;
}

export async function getGifts(params: GetGiftsParams = {}): Promise<GetGiftsResult> {
  const { page = 1, perPage = 10 } = params;
  const start = (page - 1) * perPage;

  const { data, error, count } = await (supabase as any)
    .from('gifts')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(start, start + perPage - 1);

  if (error) throw error;

  return {
    data: (data ?? []) as AdminGift[],
    count: count ?? 0,
  };
}

export async function toggleGiftActive(id: string, isActive: boolean): Promise<void> {
  const { error } = await (supabase as any)
    .from('gifts')
    .update({ is_active: isActive })
    .eq('id', id);

  if (error) throw error;

  await logAdminAction('Toggle gift active', 'gift', id, { is_active: isActive });
}

export async function updateGiftPrice(id: string, price: number): Promise<void> {
  const { error } = await (supabase as any)
    .from('gifts')
    .update({ cost_coins: price })
    .eq('id', id);

  if (error) throw error;

  await logAdminAction('Update gift price', 'gift', id, { cost_coins: price });
}

export async function createGift(gift: {
  name: string;
  cost_coins: number;
  tier: string;
  icon_url: string;
}): Promise<void> {
  const { error } = await (supabase as any).from('gifts').insert({
    name: gift.name,
    cost_coins: gift.cost_coins,
    tier: gift.tier,
    icon_url: gift.icon_url,
    is_active: true,
  });

  if (error) throw error;

  await logAdminAction('Create gift', 'gift', undefined, gift);
}

export interface AdminGiftTransaction {
  id: string;
  gift_id: string;
  from_user_id: string;
  to_user_id: string;
  room_id?: string | null;
  message?: string | null;
  created_at: string;
  gift?: { name?: string | null; icon_url?: string | null } | null;
  sender?: { username?: string | null; full_name?: string | null } | null;
  receiver?: { username?: string | null; full_name?: string | null } | null;
}

export interface GetGiftTransactionsParams {
  page?: number;
  perPage?: number;
}

export interface GetGiftTransactionsResult {
  data: AdminGiftTransaction[];
  count: number;
}

export async function getGiftTransactions(
  params: GetGiftTransactionsParams = {}
): Promise<GetGiftTransactionsResult> {
  const { page = 1, perPage = 10 } = params;
  const start = (page - 1) * perPage;

  const { data, error, count } = await (supabase as any)
    .from('sent_gifts')
    .select(
      `*,
      gift:gifts!sent_gifts_gift_id_fkey(name, icon_url),
      sender:profiles!sent_gifts_from_user_id_fkey(username, full_name),
      receiver:profiles!sent_gifts_to_user_id_fkey(username, full_name)`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(start, start + perPage - 1);

  if (error) throw error;

  return {
    data: (data ?? []) as AdminGiftTransaction[],
    count: count ?? 0,
  };
}

export interface AdminGiftExchangeRate {
  id: string;
  gift_rarity: string;
  exchange_rate: number;
  base_price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getGiftExchangeRates(): Promise<AdminGiftExchangeRate[]> {
  const { data, error } = await (supabase as any)
    .from('gift_exchange_rates')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as AdminGiftExchangeRate[];
}

export interface AdminActivityLogEntry {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id?: string | null;
  details?: Record<string, any> | null;
  created_at: string;
  admin?: { username?: string | null; full_name?: string | null } | null;
}

export interface GetAdminActivityLogParams {
  page?: number;
  perPage?: number;
}

export interface GetAdminActivityLogResult {
  data: AdminActivityLogEntry[];
  count: number;
}

export interface PlatformSetting {
  key: string;
  value: Record<string, any>;
  updated_by?: string | null;
  updated_at?: string | null;
}

export interface AdminStatOverTime {
  date: string;
  actions: number;
}

export async function getAdminActivityLog(
  params: GetAdminActivityLogParams = {}
): Promise<GetAdminActivityLogResult> {
  const { page = 1, perPage = 20 } = params;
  const start = (page - 1) * perPage;

  const { data, error, count } = await (supabase as any)
    .from('admin_activity_log')
    .select(
      `*,
      admin:profiles!admin_id(username, full_name)`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(start, start + perPage - 1);

  if (error) throw error;

  return {
    data: (data ?? []) as AdminActivityLogEntry[],
    count: count ?? 0,
  };
}

export async function getPlatformSettings(): Promise<PlatformSetting[]> {
  const { data, error } = await (supabase as any)
    .from('platform_settings')
    .select('*')
    .order('key', { ascending: true });

  if (error) throw error;
  return (data ?? []) as PlatformSetting[];
}

export async function upsertPlatformSetting(
  key: string,
  value: Record<string, any>
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await (supabase as any)
    .from('platform_settings')
    .upsert({
      key,
      value,
      updated_by: user?.id ?? null,
      updated_at: new Date().toISOString(),
    });

  if (error) throw error;

  await logAdminAction('Update platform setting', 'platform_setting', key, { value });
}

export async function getAdminAccounts(): Promise<AdminUser[]> {
  const { data, error } = await (supabase as any)
    .from('profiles')
    .select('*')
    .eq('is_admin', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as AdminUser[];
}

export async function getAdminStatsOverTime(): Promise<AdminStatOverTime[]> {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const { data, error } = await (supabase as any)
    .from('admin_activity_log')
    .select('created_at, action')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: true });

  if (error) throw error;

  const rows = (data ?? []) as { created_at: string; action: string }[];

  if (rows.length === 0) {
    const fallback: AdminStatOverTime[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      fallback.push({
        date: d.toISOString().split('T')[0],
        actions: 0,
      });
    }
    return fallback;
  }

  const counts: Record<string, number> = {};
  for (const row of rows) {
    const day = row.created_at.split('T')[0];
    counts[day] = (counts[day] ?? 0) + 1;
  }

  const series: AdminStatOverTime[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const day = d.toISOString().split('T')[0];
    series.push({ date: day, actions: counts[day] ?? 0 });
  }

  return series;
}
