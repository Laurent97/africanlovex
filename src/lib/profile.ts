import { supabase } from './supabase'
import { uploadToCloudinary, validateFile } from './cloudinary'
import type { Database } from './supabase'

type Profile = Database['public']['Tables']['profiles']['Row']
type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

// Get current user profile
export const getCurrentProfile = async (): Promise<Profile | null> => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) throw error
  return data
}

// Update profile
export const updateProfile = async (updates: ProfileUpdate): Promise<Profile> => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Upload profile picture
export const uploadProfilePicture = async (file: File): Promise<string> => {
  // Validate file
  const validation = validateFile(file, 'profile')
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  // Upload to Cloudinary
  const { url } = await uploadToCloudinary(file, 'profile')
  
  // Update profile with new avatar URL
  await updateProfile({ avatar_url: url })
  
  return url
}

// Get user by username
export const getUserByUsername = async (username: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

// Search profiles with filters
export const searchProfiles = async (filters: {
  country?: string
  city?: string
  age_min?: number
  age_max?: number
  gender?: 'male' | 'female' | 'other'
  interests?: string[]
  languages?: string[]
  relationship_intention?: string
  limit?: number
  offset?: number
}): Promise<{ profiles: Profile[], total: number }> => {
  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' })

  // Apply filters
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
  
  if (filters.interests && filters.interests.length > 0) {
    query = query.contains('interests', filters.interests)
  }
  
  if (filters.languages && filters.languages.length > 0) {
    query = query.contains('languages', filters.languages)
  }
  
  if (filters.relationship_intention) {
    query = query.eq('relationship_intention', filters.relationship_intention)
  }

  // Pagination
  const limit = filters.limit || 20
  const offset = filters.offset || 0
  
  query = query
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false })

  const { data, error, count } = await query

  if (error) throw error
  
  return {
    profiles: data || [],
    total: count || 0
  }
}

// Get suggested profiles for matching
export const getSuggestedProfiles = async (limit: number = 10): Promise<Profile[]> => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get current user profile
  const currentProfile = await getCurrentProfile()
  if (!currentProfile) throw new Error('Profile not found')

  // Get profiles that user hasn't matched with yet
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      matches!matches_user2_id_fkey(
        id,
        status
      )
    `)
    .neq('id', user.id)
    .neq('gender', currentProfile.gender) // Opposite gender (can be customized)
    .eq('is_verified', true)
    .limit(limit * 2) // Get more to filter out already matched

  if (error) throw error

  // Filter out already matched profiles
  const filteredProfiles = (data || []).filter(profile => {
    const matches = profile.matches || []
    return !matches.some((match: any) => 
      match.status === 'matched' || match.status === 'pending'
    )
  }).slice(0, limit)

  return filteredProfiles
}

// Update verification level
export const updateVerificationLevel = async (
  level: 'basic' | 'standard' | 'premium'
): Promise<Profile> => {
  const updates: ProfileUpdate = {
    verification_level: level,
    is_verified: level !== 'basic'
  }

  // Add bonus coins for verification
  let bonusCoins = 0
  if (level === 'standard') bonusCoins = 50
  if (level === 'premium') bonusCoins = 200

  if (bonusCoins > 0) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.rpc('update_coins_balance', {
        user_uuid: user.id,
        amount_change: bonusCoins
      })

      await supabase
        .from('coin_transactions')
        .insert({
          user_id: user.id,
          amount: bonusCoins,
          transaction_type: 'bonus',
          description: `Verification bonus - ${level} level`
        })
    }
  }

  return await updateProfile(updates)
}

// Upload verification documents
export const uploadVerificationDocument = async (
  file: File,
  documentType: 'id_card' | 'selfie' | 'video'
): Promise<string> => {
  const validation = validateFile(file, 'verification')
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  const { url } = await uploadToCloudinary(file, 'verification')
  return url
}

// Get profile statistics
export const getProfileStats = async (userId: string): Promise<{
  matches_count: number
  gifts_sent_count: number
  gifts_received_count: number
  coins_spent: number
  coins_earned: number
}> => {
  // Get matches count
  const { count: matchesCount } = await supabase
    .from('matches')
    .select('*', { count: 'exact', head: true })
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .eq('status', 'matched')

  // Get gifts sent count
  const { count: giftsSentCount } = await supabase
    .from('sent_gifts')
    .select('*', { count: 'exact', head: true })
    .eq('from_user_id', userId)

  // Get gifts received count
  const { count: giftsReceivedCount } = await supabase
    .from('sent_gifts')
    .select('*', { count: 'exact', head: true })
    .eq('to_user_id', userId)

  // Get coin transactions
  const { data: transactions } = await supabase
    .from('coin_transactions')
    .select('amount, transaction_type')
    .eq('user_id', userId)

  let coinsSpent = 0
  let coinsEarned = 0

  transactions?.forEach(transaction => {
    if (transaction.amount < 0) {
      coinsSpent += Math.abs(transaction.amount)
    } else {
      coinsEarned += transaction.amount
    }
  })

  return {
    matches_count: matchesCount || 0,
    gifts_sent_count: giftsSentCount || 0,
    gifts_received_count: giftsReceivedCount || 0,
    coins_spent: coinsSpent,
    coins_earned: coinsEarned
  }
}

// Delete profile account
export const deleteProfile = async (): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Delete profile (cascade will handle related records)
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', user.id)

  if (error) throw error

  // Delete auth user
  await supabase.auth.admin.deleteUser(user.id)
}

// Report profile
export const reportProfile = async (
  reportedUserId: string,
  reason: string,
  description: string
): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('profile_reports')
    .insert({
      reporter_id: user.id,
      reported_user_id: reportedUserId,
      reason,
      description,
      status: 'pending'
    })

  if (error) throw error
}

// Block profile
export const blockProfile = async (blockedUserId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('blocked_users')
    .insert({
      blocker_id: user.id,
      blocked_user_id: blockedUserId
    })

  if (error) throw error
}

// Check if profile is blocked
export const isProfileBlocked = async (userId: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data } = await supabase
    .from('blocked_users')
    .select('*')
    .or(`(blocker_id.eq.${user.id},blocked_user_id.eq.${userId}),(blocker_id.eq.${userId},blocked_user_id.eq.${user.id})`)
    .single()

  return !!data
}
