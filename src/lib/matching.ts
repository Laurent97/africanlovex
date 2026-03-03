import { supabase } from './supabase'
import type { Database } from './supabase'

type Profile = Database['public']['Tables']['profiles']['Row']
type Match = Database['public']['Tables']['matches']['Row']

export interface MatchFilters {
  country?: string
  city?: string
  age_min?: number
  age_max?: number
  gender?: 'male' | 'female' | 'other'
  interests?: string[]
  languages?: string[]
  relationship_intention?: string
  tribe?: string
  verification_level?: 'basic' | 'standard' | 'premium'
  vip_tier?: string
  max_distance?: number // in kilometers
  last_active?: number // hours ago
}

export interface MatchScore {
  profile: Profile
  score: number
  reasons: string[]
}

// Calculate distance between two coordinates (Haversine formula)
export const calculateDistance = (
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number => {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Calculate compatibility score between two profiles
export const calculateCompatibilityScore = (
  profile1: Profile, 
  profile2: Profile
): MatchScore => {
  let score = 0
  const reasons: string[] = []

  // Age compatibility (20 points)
  if (profile1.age && profile2.age) {
    const ageDiff = Math.abs(profile1.age - profile2.age)
    if (ageDiff <= 5) {
      score += 20
      reasons.push('Similar age range')
    } else if (ageDiff <= 10) {
      score += 10
      reasons.push('Compatible age range')
    }
  }

  // Location compatibility (25 points)
  if (profile1.country === profile2.country) {
    score += 15
    reasons.push('Same country')
    
    if (profile1.city === profile2.city) {
      score += 10
      reasons.push('Same city')
    }
  }

  // Language compatibility (15 points)
  if (profile1.languages && profile2.languages) {
    const commonLanguages = profile1.languages.filter(lang => 
      profile2.languages?.includes(lang)
    )
    if (commonLanguages.length > 0) {
      score += Math.min(commonLanguages.length * 5, 15)
      reasons.push(`Common languages: ${commonLanguages.join(', ')}`)
    }
  }

  // Interest compatibility (20 points)
  if (profile1.interests && profile2.interests) {
    const commonInterests = profile1.interests.filter(interest => 
      profile2.interests?.includes(interest)
    )
    if (commonInterests.length > 0) {
      score += Math.min(commonInterests.length * 4, 20)
      reasons.push(`Common interests: ${commonInterests.join(', ')}`)
    }
  }

  // Relationship intention compatibility (10 points)
  if (profile1.relationship_intention === profile2.relationship_intention) {
    score += 10
    reasons.push('Similar relationship goals')
  }

  // Verification level bonus (5 points)
  if (profile2.verification_level === 'premium') {
    score += 5
    reasons.push('Premium verified user')
  } else if (profile2.verification_level === 'standard') {
    score += 3
    reasons.push('Verified user')
  }

  // VIP status bonus (5 points)
  if (profile2.vip_tier !== 'free') {
    score += 5
    reasons.push('VIP member')
  }

  // Tribe compatibility (5 points) - optional
  if (profile1.tribe && profile2.tribe && profile1.tribe === profile2.tribe) {
    score += 5
    reasons.push('Same tribe/ethnic group')
  }

  return {
    profile: profile2,
    score: Math.min(score, 100), // Cap at 100
    reasons
  }
}

// Get potential matches for a user
export const getPotentialMatches = async (
  userId: string,
  filters: MatchFilters = {},
  limit: number = 20
): Promise<MatchScore[]> => {
  // Get user's profile
  const { data: userProfile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (profileError) throw profileError
  if (!userProfile) throw new Error('User profile not found')

  // Build query for potential matches
  let query = supabase
    .from('profiles')
    .select('*')
    .neq('id', userId) // Exclude self

  // Apply basic filters
  if (filters.country) {
    query = query.eq('country', filters.country)
  }
  
  if (filters.city) {
    query = query.eq('city', filters.city)
  }
  
  if (filters.age_min) {
    query = query.gte('age', filters.age_min)
  }
  
  if (filters.age_max) {
    query = query.lte('age', filters.age_max)
  }
  
  if (filters.gender) {
    query = query.eq('gender', filters.gender)
  }
  
  if (filters.verification_level) {
    query = query.eq('verification_level', filters.verification_level)
  }
  
  if (filters.vip_tier) {
    query = query.eq('vip_tier', filters.vip_tier)
  }

  // Get already matched users to exclude
  const { data: existingMatches } = await supabase
    .from('matches')
    .select('user1_id, user2_id')
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)

  const matchedUserIds = existingMatches?.map(match => 
    match.user1_id === userId ? match.user2_id : match.user1_id
  ) || []

  // Exclude already matched users
  if (matchedUserIds.length > 0) {
    query = query.not('id', 'in', `(${matchedUserIds.join(',')})`)
  }

  // Get blocked users to exclude
  const { data: blockedUsers } = await supabase
    .from('blocked_users')
    .select('blocked_user_id')
    .eq('blocker_id', userId)

  const blockedUserIds = blockedUsers?.map(b => b.blocked_user_id) || []

  if (blockedUserIds.length > 0) {
    query = query.not('id', 'in', `(${blockedUserIds.join(',')})`)
  }

  // Execute query with limit
  const { data: potentialProfiles, error: queryError } = await query
    .limit(limit * 2) // Get more to allow for filtering
    .order('created_at', { ascending: false })

  if (queryError) throw queryError

  // Calculate compatibility scores
  const scoredProfiles: MatchScore[] = (potentialProfiles || []).map(profile => 
    calculateCompatibilityScore(userProfile, profile)
  )

  // Apply additional filters
  let filteredProfiles = scoredProfiles

  // Filter by interests
  if (filters.interests && filters.interests.length > 0) {
    filteredProfiles = filteredProfiles.filter(match => 
      match.profile.interests?.some(interest => filters.interests!.includes(interest))
    )
  }

  // Filter by languages
  if (filters.languages && filters.languages.length > 0) {
    filteredProfiles = filteredProfiles.filter(match => 
      match.profile.languages?.some(lang => filters.languages!.includes(lang))
    )
  }

  // Filter by relationship intention
  if (filters.relationship_intention) {
    filteredProfiles = filteredProfiles.filter(match => 
      match.profile.relationship_intention === filters.relationship_intention
    )
  }

  // Filter by tribe
  if (filters.tribe) {
    filteredProfiles = filteredProfiles.filter(match => 
      match.profile.tribe === filters.tribe
    )
  }

  // Sort by score (highest first) and limit
  return filteredProfiles
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

// Create a match between two users
export const createMatch = async (
  user1Id: string,
  user2Id: string
): Promise<Match> => {
  // Check if users can match
  const { data: canMatch, error: checkError } = await supabase
    .rpc('can_match', { user1_uuid: user1Id, user2_uuid: user2Id })

  if (checkError) throw checkError
  if (!canMatch) throw new Error('Users cannot match')

  // Create the match
  const { data, error } = await supabase
    .from('matches')
    .insert({
      user1_id: user1Id,
      user2_id: user2Id,
      status: 'pending'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Update match status
export const updateMatchStatus = async (
  matchId: string,
  status: 'matched' | 'rejected' | 'expired'
): Promise<Match> => {
  const { data, error } = await supabase
    .from('matches')
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', matchId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Get user's matches
export const getUserMatches = async (
  userId: string,
  status?: 'pending' | 'matched' | 'rejected'
): Promise<Match[]> => {
  let query = supabase
    .from('matches')
    .select(`
      *,
      user1_profile:profiles!matches_user1_id_fkey(*),
      user2_profile:profiles!matches_user2_id_fkey(*)
    `)
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

// Get daily recommendations
export const getDailyRecommendations = async (
  userId: string,
  limit: number = 10
): Promise<MatchScore[]> => {
  const today = new Date().toISOString().split('T')[0]
  
  // Check if we already generated recommendations today
  const { data: existingRecommendations } = await supabase
    .from('daily_recommendations')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)

  if (existingRecommendations && existingRecommendations.length > 0) {
    // Return existing recommendations
    const recommendationIds = existingRecommendations.map(r => r.recommended_user_id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', recommendationIds)

    return (profiles || []).map(profile => ({
      profile,
      score: existingRecommendations.find(r => r.recommended_user_id === profile.id)?.score || 0,
      reasons: []
    }))
  }

  // Generate new recommendations
  const recommendations = await getPotentialMatches(userId, {}, limit)

  // Save recommendations for today
  if (recommendations.length > 0) {
    await supabase
      .from('daily_recommendations')
      .insert(
        recommendations.map(rec => ({
          user_id: userId,
          recommended_user_id: rec.profile.id,
          score: rec.score,
          date: today
        }))
      )
  }

  return recommendations
}

// Swipe action (like/pass)
export const swipeProfile = async (
  userId: string,
  profileId: string,
  action: 'like' | 'pass'
): Promise<{ matched: boolean; matchId?: string }> => {
  if (action === 'pass') {
    // Just record the pass for better recommendations
    await supabase
      .from('swipe_history')
      .insert({
        user_id: userId,
        profile_id: profileId,
        action: 'pass'
      })
    
    return { matched: false }
  }

  // Check if the other user has already liked this user
  const { data: existingLike } = await supabase
    .from('swipe_history')
    .select('*')
    .eq('user_id', profileId)
    .eq('profile_id', userId)
    .eq('action', 'like')
    .single()

  // Record this like
  await supabase
    .from('swipe_history')
    .insert({
      user_id: userId,
      profile_id: profileId,
      action: 'like'
    })

  // If mutual like, create a match
  if (existingLike) {
    const match = await createMatch(userId, profileId)
    await updateMatchStatus(match.id, 'matched')
    
    return { matched: true, matchId: match.id }
  }

  return { matched: false }
}

// Get swipe history
export const getSwipeHistory = async (
  userId: string,
  limit: number = 50
): Promise<{ profile_id: string; action: 'like' | 'pass'; created_at: string }[]> => {
  const { data, error } = await supabase
    .from('swipe_history')
    .select('profile_id, action, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

// Get match statistics
export const getMatchStats = async (userId: string): Promise<{
  total_swipes: number
  likes: number
  passes: number
  matches: number
  match_rate: number
}> => {
  // Get swipe stats
  const { data: swipeStats } = await supabase
    .from('swipe_history')
    .select('action')
    .eq('user_id', userId)

  const totalSwipes = swipeStats?.length || 0
  const likes = swipeStats?.filter(s => s.action === 'like').length || 0
  const passes = swipeStats?.filter(s => s.action === 'pass').length || 0

  // Get match count
  const { count: matchCount } = await supabase
    .from('matches')
    .select('*', { count: 'exact', head: true })
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .eq('status', 'matched')

  return {
    total_swipes: totalSwipes,
    likes,
    passes,
    matches: matchCount || 0,
    match_rate: totalSwipes > 0 ? Math.round((matchCount || 0) / totalSwipes * 100) : 0
  }
}
