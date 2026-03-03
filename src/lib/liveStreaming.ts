import { supabase } from './supabase'
import type { Database } from './supabase'

type LiveRoom = Database['public']['Tables']['live_rooms']['Row']

export interface CreateRoomData {
  title: string
  description?: string
  room_type: 'public' | 'private' | 'speed_dating'
  max_viewers?: number
  cost_per_minute?: number
  thumbnail_url?: string
}

export interface RoomParticipant {
  user_id: string
  username: string
  avatar_url?: string
  joined_at: string
  is_host: boolean
  is_muted?: boolean
  is_video_enabled?: boolean
}

// Create a new live room
export const createLiveRoom = async (
  hostId: string,
  roomData: CreateRoomData
): Promise<LiveRoom> => {
  const { data, error } = await supabase
    .from('live_rooms')
    .insert({
      host_id: hostId,
      title: roomData.title,
      description: roomData.description || null,
      room_type: roomData.room_type,
      is_active: true,
      viewer_count: 0,
      max_viewers: roomData.max_viewers || 100,
      cost_per_minute: roomData.cost_per_minute || null,
      thumbnail_url: roomData.thumbnail_url || null
    })
    .select()
    .single()

  if (error) throw error
  return data!
}

// Get active live rooms
export const getActiveLiveRooms = async (
  filters: {
    room_type?: 'public' | 'private' | 'speed_dating'
    country?: string
    limit?: number
  } = {}
): Promise<LiveRoom[]> => {
  let query = supabase
    .from('live_rooms')
    .select(`
      *,
      host_profile:profiles!live_rooms_host_id_fkey(username, avatar_url, country, verification_level)
    `)
    .eq('is_active', true)
    .order('viewer_count', { ascending: false })

  if (filters.room_type) {
    query = query.eq('room_type', filters.room_type)
  }

  if (filters.country) {
    query = query.eq('host_profile.country', filters.country)
  }

  if (filters.limit) {
    query = query.limit(filters.limit)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

// Get room details
export const getRoomDetails = async (roomId: string): Promise<{
  room: LiveRoom
  host: Database['public']['Tables']['profiles']['Row']
  participants: RoomParticipant[]
}> => {
  const { data: room, error: roomError } = await supabase
    .from('live_rooms')
    .select(`
      *,
      host_profile:profiles!live_rooms_host_id_fkey(*)
    `)
    .eq('id', roomId)
    .single()

  if (roomError) throw roomError
  if (!room) throw new Error('Room not found')

  // Get participants (in a real implementation, this would come from a separate participants table)
  const participants: RoomParticipant[] = [
    {
      user_id: room.host_id,
      username: room.host_profile.username,
      avatar_url: room.host_profile.avatar_url,
      joined_at: room.created_at,
      is_host: true
    }
  ]

  return {
    room,
    host: room.host_profile,
    participants
  }
}

// Join a live room
export const joinLiveRoom = async (
  userId: string,
  roomId: string
): Promise<{ success: boolean; cost_per_minute?: number }> => {
  // Get room details
  const { data: room, error: roomError } = await supabase
    .from('live_rooms')
    .select('*')
    .eq('id', roomId)
    .single()

  if (roomError) throw roomError
  if (!room) throw new Error('Room not found')
  if (!room.is_active) throw new Error('Room is not active')

  // Check if room is full
  if (room.viewer_count >= room.max_viewers) {
    throw new Error('Room is full')
  }

  // For private rooms, check if user has access
  if (room.room_type === 'private') {
    // In a real implementation, this would check invitations or payments
    // For now, we'll allow access
  }

  // Increment viewer count
  const { error: updateError } = await supabase
    .from('live_rooms')
    .update({
      viewer_count: room.viewer_count + 1,
      updated_at: new Date().toISOString()
    })
    .eq('id', roomId)

  if (updateError) throw updateError

  return {
    success: true,
    cost_per_minute: room.cost_per_minute || undefined
  }
}

// Leave a live room
export const leaveLiveRoom = async (
  userId: string,
  roomId: string
): Promise<void> => {
  // Get current room details
  const { data: room, error: roomError } = await supabase
    .from('live_rooms')
    .select('viewer_count')
    .eq('id', roomId)
    .single()

  if (roomError) throw roomError
  if (!room) return

  // Decrement viewer count
  const { error: updateError } = await supabase
    .from('live_rooms')
    .update({
      viewer_count: Math.max(0, room.viewer_count - 1),
      updated_at: new Date().toISOString()
    })
    .eq('id', roomId)

  if (updateError) throw updateError
}

// End a live room (host only)
export const endLiveRoom = async (
  hostId: string,
  roomId: string
): Promise<void> => {
  // Verify user is the host
  const { data: room, error: roomError } = await supabase
    .from('live_rooms')
    .select('host_id')
    .eq('id', roomId)
    .single()

  if (roomError) throw roomError
  if (!room) throw new Error('Room not found')
  if (room.host_id !== hostId) throw new Error('Only the host can end the room')

  // Deactivate the room
  const { error: updateError } = await supabase
    .from('live_rooms')
    .update({
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', roomId)

  if (updateError) throw updateError
}

// Get user's hosted rooms
export const getUserHostedRooms = async (
  userId: string,
  includeInactive: boolean = false
): Promise<LiveRoom[]> => {
  let query = supabase
    .from('live_rooms')
    .select('*')
    .eq('host_id', userId)
    .order('created_at', { ascending: false })

  if (!includeInactive) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

// Get room categories for filtering
export const getRoomCategories = () => [
  {
    id: 'speed_dating',
    name: 'Speed Dating',
    description: '3-minute rotations to meet multiple people',
    icon: '⚡'
  },
  {
    id: 'couple_goals',
    name: 'Couple Goals',
    description: 'Established couples streaming together',
    icon: '💑'
  },
  {
    id: 'culture_night',
    name: 'Culture Night',
    description: 'Traditional music, storytelling, dating advice',
    icon: '🌍'
  },
  {
    id: 'music_chat',
    name: 'Music & Chat',
    description: 'Share and discuss East African music',
    icon: '🎵'
  },
  {
    id: 'cooking_together',
    name: 'Cooking Together',
    description: 'Learn and share traditional recipes',
    icon: '🍳'
  },
  {
    id: 'dance_party',
    name: 'Dance Party',
    description: 'Dance to the latest East African hits',
    icon: '💃'
  }
]

// Search live rooms
export const searchLiveRooms = async (
  query: string,
  filters: {
    room_type?: 'public' | 'private' | 'speed_dating'
    country?: string
    min_viewers?: number
    max_cost_per_minute?: number
  } = {}
): Promise<LiveRoom[]> => {
  let dbQuery = supabase
    .from('live_rooms')
    .select(`
      *,
      host_profile:profiles!live_rooms_host_id_fkey(username, avatar_url, country)
    `)
    .eq('is_active', true)
    .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    .order('viewer_count', { ascending: false })

  if (filters.room_type) {
    dbQuery = dbQuery.eq('room_type', filters.room_type)
  }

  if (filters.country) {
    dbQuery = dbQuery.eq('host_profile.country', filters.country)
  }

  if (filters.min_viewers) {
    dbQuery = dbQuery.gte('viewer_count', filters.min_viewers)
  }

  if (filters.max_cost_per_minute) {
    dbQuery = dbQuery.lte('cost_per_minute', filters.max_cost_per_minute)
  }

  const { data, error } = await dbQuery
  if (error) throw error
  return data || []
}

// Record room viewing time (for billing private rooms)
export const recordRoomViewTime = async (
  userId: string,
  roomId: string,
  minutes: number
): Promise<void> => {
  // In a real implementation, this would:
  // 1. Calculate cost based on room's per-minute rate
  // 2. Deduct coins from user's balance
  // 3. Record the viewing session
  // 4. Handle payment failures
  
  const { data: room } = await supabase
    .from('live_rooms')
    .select('cost_per_minute')
    .eq('id', roomId)
    .single()

  if (!room || !room.cost_per_minute) return

  const totalCost = room.cost_per_minute * minutes

  // Deduct coins
  await supabase.rpc('update_coins_balance', {
    user_uuid: userId,
    amount_change: -totalCost
  })

  // Record transaction
  await supabase
    .from('coin_transactions')
    .insert({
      user_id: userId,
      amount: -totalCost,
      transaction_type: 'withdrawal',
      description: `Private room viewing: ${minutes} minutes`,
      reference_id: roomId
    })
}

// Get room statistics
export const getRoomStatistics = async (roomId: string): Promise<{
  total_viewers: number
  peak_viewers: number
  total_minutes: number
  total_revenue: number
  average_view_time: number
}> => {
  // In a real implementation, this would query a room_analytics table
  // For now, return mock data
  
  const { data: room } = await supabase
    .from('live_rooms')
    .select('viewer_count, cost_per_minute, created_at')
    .eq('id', roomId)
    .single()

  if (!room) {
    throw new Error('Room not found')
  }

  return {
    total_viewers: room.viewer_count,
    peak_viewers: room.viewer_count, // Would be tracked separately
    total_minutes: 0, // Would be calculated from viewing sessions
    total_revenue: 0, // Would be calculated from paid sessions
    average_view_time: 0 // Would be calculated from viewing sessions
  }
}

// Report a live room
export const reportLiveRoom = async (
  reporterId: string,
  roomId: string,
  reason: string,
  description: string
): Promise<void> => {
  const { error } = await supabase
    .from('room_reports')
    .insert({
      reporter_id: reporterId,
      room_id: roomId,
      reason,
      description,
      status: 'pending'
    })

  if (error) throw error
}

// Get room recommendations for user
export const getRoomRecommendations = async (
  userId: string,
  limit: number = 10
): Promise<LiveRoom[]> => {
  // Get user's profile for personalization
  const { data: profile } = await supabase
    .from('profiles')
    .select('country, interests, languages')
    .eq('id', userId)
    .single()

  if (!profile) return []

  // Get rooms from user's country and with matching interests
  const { data: rooms } = await supabase
    .from('live_rooms')
    .select(`
      *,
      host_profile:profiles!live_rooms_host_id_fkey(username, avatar_url, country, interests)
    `)
    .eq('is_active', true)
    .eq('room_type', 'public')
    .neq('host_id', userId) // Exclude user's own rooms
    .order('viewer_count', { ascending: false })
    .limit(limit * 2) // Get more to filter

  if (!rooms) return []

  // Score rooms based on relevance
  const scoredRooms = rooms.map(room => {
    let score = 0

    // Country match
    if (room.host_profile.country === profile.country) {
      score += 30
    }

    // Interest overlap
    if (profile.interests && room.host_profile.interests) {
      const commonInterests = profile.interests.filter(interest =>
        room.host_profile.interests?.includes(interest)
      )
      score += commonInterests.length * 10
    }

    // Language overlap
    if (profile.languages && room.host_profile.languages) {
      const commonLanguages = profile.languages.filter(lang =>
        room.host_profile.languages?.includes(lang)
      )
      score += commonLanguages.length * 5
    }

    // Viewer count (popularity)
    score += Math.min(room.viewer_count, 20)

    return { room, score }
  })

  // Sort by score and return top recommendations
  return scoredRooms
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.room)
}
