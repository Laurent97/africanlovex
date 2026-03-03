import { supabase } from './supabase'
import type { Database } from './supabase'

type Profile = Database['public']['Tables']['profiles']['Row']
type Report = Database['public']['Tables']['profile_reports']['Row']
type BlockedUser = Database['public']['Tables']['blocked_users']['Row']

export interface ReportData {
  reporter_id: string
  reported_user_id: string
  reason: string
  description: string
  category: 'fake_profile' | 'inappropriate_content' | 'scam' | 'harassment' | 'underage' | 'other'
  evidence?: string[]
}

export interface ModerationAction {
  report_id: string
  action: 'warn' | 'suspend' | 'ban' | 'clear'
  moderator_id: string
  notes?: string
  duration_days?: number // for suspension
}

export interface SafetyMetrics {
  total_reports: number
  pending_reports: number
  resolved_reports: number
  active_suspensions: number
  active_bans: number
  reports_by_category: Record<string, number>
  reports_by_country: Record<string, number>
  top_report_reasons: Array<{ reason: string; count: number }>
}

// Report a profile
export const reportProfile = async (reportData: ReportData): Promise<Report> => {
  const { data, error } = await supabase
    .from('profile_reports')
    .insert({
      reporter_id: reportData.reporter_id,
      reported_user_id: reportData.reported_user_id,
      reason: reportData.reason,
      category: reportData.category,
      description: reportData.description,
      evidence: reportData.evidence || [],
      status: 'pending'
    })
    .select()
    .single()

  if (error) throw error
  return data!
}

// Block a user
export const blockUser = async (
  blockerId: string,
  blockedUserId: string
): Promise<BlockedUser> => {
  const { data, error } = await supabase
    .from('blocked_users')
    .insert({
      blocker_id: blockerId,
      blocked_user_id: blockedUserId
    })
    .select()
    .single()

  if (error) throw error
  return data!
}

// Unblock a user
export const unblockUser = async (
  blockerId: string,
  blockedUserId: string
): Promise<void> => {
  const { error } = await supabase
    .from('blocked_users')
    .delete()
    .eq('blocker_id', blockerId)
    .eq('blocked_user_id', blockedUserId)

  if (error) throw error
}

// Get blocked users
export const getBlockedUsers = async (userId: string): Promise<BlockedUser[]> => {
  const { data, error } = await supabase
    .from('blocked_users')
    .select(`
      *,
      blocked_profile:profiles!blocked_users_blocked_user_id_fkey(username, avatar_url, country)
    `)
    .eq('blocker_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

// Check if user is blocked
export const isUserBlocked = async (
  userId: string,
  targetUserId: string
): Promise<boolean> => {
  const { data, error } = await supabase
    .from('blocked_users')
    .select('*')
    .or(`(blocker_id.eq.${userId},blocked_user_id.eq.${userId}),(blocker_id.eq.${targetUserId},blocked_user_id.eq.${targetUserId})`)
    .single()

  if (error) return false
  return !!data
}

// Get reports for moderation
export const getReports = async (
  status?: 'pending' | 'reviewing' | 'resolved' | 'dismissed',
  category?: string,
  limit: number = 50
): Promise<Report[]> => {
  let query = supabase
    .from('profile_reports')
    .select(`
      *,
      reporter_profile:profiles!profile_reports_reporter_id_fkey(username, avatar_url),
      reported_profile:profiles!profile_reports_reported_user_id_fkey(username, avatar_url, country)
    `)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  if (category) {
    query = query.eq('category', category)
  }

  const { data, error } = await query.limit(limit)
  if (error) throw error
  return data || []
}

// Get report details
export const getReportDetails = async (reportId: string): Promise<{
  report: Report & {
    reporter_profile: Profile
    reported_profile: Profile
  }
  similar_reports: Report[]
}> => {
  // Get main report
  const { data: report, error: reportError } = await supabase
    .from('profile_reports')
    .select(`
      *,
      reporter_profile:profiles!profile_reports_reporter_id_fkey(*),
      reported_profile:profiles!profile_reports_reported_user_id_fkey(*)
    `)
    .eq('id', reportId)
    .single()

  if (reportError) throw reportError
  if (!report) throw new Error('Report not found')

  // Get similar reports (same user, same category)
  const { data: similarReports, error: similarError } = await supabase
    .from('profile_reports')
    .select('*')
    .eq('reported_user_id', report.reported_user_id)
    .eq('category', report.category)
    .neq('id', reportId)
    .order('created_at', { ascending: false })
    .limit(10)

  if (similarError) throw similarError

  return {
    report,
    similar_reports: similarReports || []
  }
}

// Take moderation action
export const takeModerationAction = async (
  action: ModerationAction
): Promise<void> => {
  const { error } = await supabase
    .from('moderation_actions')
    .insert(action)

  if (error) throw error

  // Update report status
  await supabase
    .from('profile_reports')
    .update({
      status: action.action === 'clear' ? 'dismissed' : 'resolved',
      updated_at: new Date().toISOString()
    })
    .eq('id', action.report_id)

  // Update user profile if suspension or ban
  if (action.action === 'suspend' || action.action === 'ban') {
    const { data: report } = await supabase
      .from('profile_reports')
      .select('reported_user_id')
      .eq('id', action.report_id)
      .single()

    if (report) {
      const suspensionEndsAt = action.action === 'suspend' && action.duration_days ? 
        new Date(Date.now() + action.duration_days * 24 * 60 * 60 * 1000).toISOString() : 
        null

      await supabase
        .from('profiles')
        .update({
          is_suspended: true,
          suspension_ends_at: suspensionEndsAt,
          suspension_reason: action.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', report.reported_user_id)
    }
  }

  // If ban, permanently ban the user
  if (action.action === 'ban') {
    await supabase.auth.admin.updateUserById(
      report.reported_user_id,
      { ban: true }
    )
  }
}

// Get safety metrics
export const getSafetyMetrics = async (): Promise<SafetyMetrics> => {
  const [
    reportsResult,
    blockedUsersResult,
    suspensionsResult
  ] = await Promise.all([
    supabase.from('profile_reports').select('*', { count: 'exact' }),
    supabase.from('blocked_users').select('*', { count: 'exact' }),
    supabase.from('profiles').select('is_suspended', { count: 'exact' })
  ])

  const totalReports = reportsResult.count || 0
  const totalBlocked = blockedUsersResult.count || 0
  const activeSuspensions = suspensionsResult.count || 0

  // Get reports by category
  const { data: reportsByCategory } = await supabase
    .from('profile_reports')
    .select('category')
    .eq('status', 'pending')

  const categoryCounts: Record<string, number> = {}
  reportsByCategory?.forEach(report => {
    categoryCounts[report.category] = (categoryCounts[report.category] || 0) + 1
  })

  // Get reports by country
  const { data: reportsByCountry } = await supabase
    .from('profile_reports')
    .select(`
      reported_profile:profiles!profile_reports_reported_user_id_fkey(country)
    `)
    .eq('status', 'pending')

  const countryCounts: Record<string, number> = {}
  reportsByCountry?.forEach(report => {
    const country = report.reported_profile.country
    if (country) {
      countryCounts[country] = (countryCounts[country] || 0) + 1
    }
  })

  // Get top report reasons
  const topReasons = Object.entries(categoryCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([reason, count]) => ({ reason, count }))

  return {
    total_reports: totalReports,
    pending_reports: categoryCounts ? Object.values(categoryCounts).reduce((sum, count) => sum + count, 0) : 0,
    resolved_reports: 0, // Would need to query resolved reports
    active_suspensions: activeSuspensions,
    active_bans: 0, // Would need to track banned users
    reports_by_category: categoryCounts,
    reports_by_country: countryCounts,
    top_report_reasons: topReasons
  }
}

// Auto-moderation using AI
export const autoModerateProfile = async (userId: string): Promise<{
  flags: string[]
  risk_score: number
  requires_review: boolean
}> => {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !profile) {
    return { flags: [], risk_score: 0, requires_review: false }
  }

  const flags: string[] = []
  let riskScore = 0

  // Check for suspicious patterns
  const suspiciousPatterns = {
    // Phone number patterns
    phoneInBio: /\+?\d{10,15}/.test(profile.bio || ''),
    multipleNumbers: (profile.bio?.match(/\+?\d{10,15}/g) || []).length > 1,
    
    // Inappropriate content
    inappropriateWords: ['sex', 'nude', 'naked', 'hookup', 'sugar', 'payment', 'bitcoin', 'crypto'],
    hasInappropriateWords: (profile.bio || '').toLowerCase().split(/\s+/).some(word => 
      suspiciousPatterns.inappropriateWords.includes(word)
    ),
    
    // Spam patterns
    repeatedChars: /(.)\1{5,}/.test(profile.bio || ''),
    allCaps: (profile.bio || '').length > 20 && (profile.bio || '').toUpperCase() === (profile.bio || ''),
    
    // Profile completeness
    incompleteProfile: !profile.avatar_url || !profile.bio || !profile.age || !profile.country,
    
    // Age verification
    ageTooYoung: profile.age && profile.age < 18,
    ageUnrealistic: profile.age && (profile.age < 16 || profile.age > 100),
    
    // Multiple accounts detection
    similarDescriptions: false // Would need to compare with other profiles
  }

  // Calculate risk score
  Object.entries(suspiciousPatterns).forEach(([key, pattern]) => {
    if (typeof pattern === 'boolean' && pattern) {
      riskScore += 10
      flags.push(key)
    } else if (typeof pattern === 'number' && pattern > 0) {
      riskScore += pattern * 2
      flags.push(key)
    }
  })

  const requiresReview = riskScore > 30 || flags.length > 2

  return {
    flags,
    risk_score: Math.min(riskScore, 100),
    requires_review
  }
}

// Check for SIM swap detection
export const detectSimSwap = async (
  userId: string,
  newPhoneNumber: string,
  country: string
): Promise<{
  risk_score: number
  requires_review: boolean
  warning?: string
}> => {
  // Get user's phone history
  const { data: phoneHistory, error } = await supabase
    .from('phone_history')
    .select('phone_number, country, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    return { risk_score: 0, requires_review: false }
  }

  let riskScore = 0
  let warning = ''

  // Check for rapid phone changes
  if (phoneHistory && phoneHistory.length > 1) {
    const recentChanges = phoneHistory.slice(0, 5)
    const countryChanges = recentChanges.filter(h => h.country !== country)
    
    if (countryChanges.length > 1) {
      riskScore += 40
      warning = 'Multiple country changes detected'
    }
    
    if (recentChanges.length >= 3) {
      riskScore += 30
      warning = 'Rapid phone number changes detected'
    }
  }

  // Check if new phone matches previous patterns
  const phonePattern = newPhoneNumber.replace(/\D/g, '').slice(-4)
  const previousPatterns = phoneHistory?.map(h => h.phone_number.replace(/\D/g, '').slice(-4))
  
  if (previousPatterns?.includes(phonePattern)) {
    riskScore += 20
    warning = 'Phone number pattern matches previous changes'
  }

  const requiresReview = riskScore > 25

  return {
    risk_score: Math.min(riskScore, 100),
    requires_review,
    warning: warning || undefined
  }
}

// Create safety alert
export const createSafetyAlert = async (
  type: 'scam_attempt' | 'inappropriate_content' | 'suspicious_activity',
  userId: string,
  details: any
): Promise<void> => {
  await supabase
    .from('safety_alerts')
    .insert({
      user_id: userId,
      alert_type: type,
      details,
      created_at: new Date().toISOString()
    })
}

// Get user's safety score
export const getUserSafetyScore = async (userId: string): Promise<{
  score: number
  level: 'low' | 'medium' | 'high'
  violations: number
  last_report: string | null
}> => {
  const [reports, autoFlags] = await Promise.all([
    getReports('resolved', undefined, 10).then(reports => 
      reports.filter(r => r.reported_user_id === userId)
    ),
    autoModerateProfile(userId)
  ])

  const reportCount = reports.length
  const autoFlagCount = autoFlags.flags.length
  const totalViolations = reportCount + autoFlagCount

  let score = 100 - (totalViolations * 10) // Start at 100, deduct 10 per violation
  score = Math.max(0, score)

  let level: 'low' | 'medium' | 'high' = 'low'
  if (score < 70) level = 'low'
  else if (score < 40) level = 'medium'
  else level = 'high'

  const lastReport = reports[0]?.created_at || null

  return {
    score,
    level,
    violations: totalViolations,
    last_report: lastReport
  }
}
