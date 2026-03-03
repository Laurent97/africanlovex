import { supabase } from './supabase'
import type { Database } from './supabase'

type Gift = Database['public']['Tables']['gifts']['Row']
type SentGift = Database['public']['Tables']['sent_gifts']['Row']
type CoinTransaction = Database['public']['Tables']['coin_transactions']['Row']

export interface GiftWithStats extends Gift {
  sent_count?: number
  received_count?: number
  total_coins_sent?: number
}

// Get all available gifts
export const getAvailableGifts = async (
  tier?: 'everyday' | 'romantic' | 'serious' | 'legendary' | 'real_world'
): Promise<Gift[]> => {
  let query = supabase
    .from('gifts')
    .select('*')
    .eq('is_active', true)
    .order('cost_coins', { ascending: true })

  if (tier) {
    query = query.eq('tier', tier)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

// Get gifts by tier with stats
export const getGiftsByTier = async (): Promise<{
  everyday: GiftWithStats[]
  romantic: GiftWithStats[]
  serious: GiftWithStats[]
  legendary: GiftWithStats[]
  real_world: GiftWithStats[]
}> => {
  const gifts = await getAvailableGifts()
  
  const grouped = {
    everyday: gifts.filter(g => g.tier === 'everyday'),
    romantic: gifts.filter(g => g.tier === 'romantic'),
    serious: gifts.filter(g => g.tier === 'serious'),
    legendary: gifts.filter(g => g.tier === 'legendary'),
    real_world: gifts.filter(g => g.tier === 'real_world')
  }

  return grouped as any
}

// Send a gift to another user
export const sendGift = async (
  fromUserId: string,
  toUserId: string,
  giftId: string,
  message?: string
): Promise<SentGift> => {
  // Get the gift details
  const { data: gift, error: giftError } = await supabase
    .from('gifts')
    .select('*')
    .eq('id', giftId)
    .single()

  if (giftError) throw giftError
  if (!gift) throw new Error('Gift not found')
  if (!gift.is_active) throw new Error('Gift is not available')

  // Check user's coin balance
  const { data: profile } = await supabase
    .from('profiles')
    .select('coins_balance')
    .eq('id', fromUserId)
    .single()

  if (!profile) throw new Error('User profile not found')
  if (profile.coins_balance < gift.cost_coins) {
    throw new Error('Insufficient coins')
  }

  // Start transaction
  const { error: transactionError } = await supabase.rpc('update_coins_balance', {
    user_uuid: fromUserId,
    amount_change: -gift.cost_coins
  })

  if (transactionError) throw transactionError

  try {
    // Record the sent gift
    const { data: sentGift, error: sendError } = await supabase
      .from('sent_gifts')
      .insert({
        from_user_id: fromUserId,
        to_user_id: toUserId,
        gift_id: giftId,
        message: message || null
      })
      .select(`
        *,
        gift:gifts(*),
        from_profile:profiles!sent_gifts_from_user_id_fkey(username, avatar_url),
        to_profile:profiles!sent_gifts_to_user_id_fkey(username, avatar_url)
      `)
      .single()

    if (sendError) throw sendError
    if (!sentGift) throw new Error('Failed to send gift')

    // Record the transaction
    await supabase
      .from('coin_transactions')
      .insert({
        user_id: fromUserId,
        amount: -gift.cost_coins,
        transaction_type: 'gift_sent',
        description: `Sent ${gift.name} to user`,
        reference_id: sentGift.id
      })

    // Add coins to recipient (if it's a real-world gift, this might be different)
    if (gift.tier !== 'real_world') {
      await supabase.rpc('update_coins_balance', {
        user_uuid: toUserId,
        amount_change: Math.floor(gift.cost_coins * 0.1) // 10% to recipient
      })

      await supabase
        .from('coin_transactions')
        .insert({
          user_id: toUserId,
          amount: Math.floor(gift.cost_coins * 0.1),
          transaction_type: 'gift_received',
          description: `Received ${gift.name} from user`,
          reference_id: sentGift.id
        })
    }

    return sentGift
  } catch (error) {
    // Rollback the coin deduction on error
    await supabase.rpc('update_coins_balance', {
      user_uuid: fromUserId,
      amount_change: gift.cost_coins
    })
    throw error
  }
}

// Get user's gift history
export const getUserGiftHistory = async (
  userId: string,
  type: 'sent' | 'received' | 'both' = 'both',
  limit: number = 50
): Promise<SentGift[]> => {
  let query = supabase
    .from('sent_gifts')
    .select(`
      *,
      gift:gifts(*),
      from_profile:profiles!sent_gifts_from_user_id_fkey(username, avatar_url),
      to_profile:profiles!sent_gifts_to_user_id_fkey(username, avatar_url)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  switch (type) {
    case 'sent':
      query = query.eq('from_user_id', userId)
      break
    case 'received':
      query = query.eq('to_user_id', userId)
      break
    case 'both':
      query = query.or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      break
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

// Get user's coin balance
export const getUserCoinBalance = async (userId: string): Promise<number> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('coins_balance')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data?.coins_balance || 0
}

// Purchase coins
export const purchaseCoins = async (
  userId: string,
  amount: number,
  paymentMethod: string,
  currency: string = 'USD'
): Promise<{ success: boolean; transaction_id?: string }> => {
  // Calculate price (100 coins = $1 USD equivalent)
  const price = amount / 100
  
  try {
    // Create a pending transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('coin_transactions')
      .insert({
        user_id: userId,
        amount: amount,
        transaction_type: 'purchase',
        description: `Purchased ${amount} LoveX Coins`,
        reference_id: null
      })
      .select()
      .single()

    if (transactionError) throw transactionError

    // In a real implementation, this would integrate with payment providers
    // For now, we'll simulate a successful payment
    const paymentSuccessful = true // This would be the result of actual payment processing

    if (paymentSuccessful) {
      // Add coins to user balance
      await supabase.rpc('update_coins_balance', {
        user_uuid: userId,
        amount_change: amount
      })

      // Update transaction status
      await supabase
        .from('coin_transactions')
        .update({
          description: `Purchased ${amount} LoveX Coins via ${paymentMethod}`
        })
        .eq('id', transaction.id)

      return { success: true, transaction_id: transaction.id }
    } else {
      // Remove the pending transaction
      await supabase
        .from('coin_transactions')
        .delete()
        .eq('id', transaction.id)

      return { success: false }
    }
  } catch (error) {
    console.error('Error purchasing coins:', error)
    return { success: false }
  }
}

// Get coin transaction history
export const getCoinTransactionHistory = async (
  userId: string,
  limit: number = 50
): Promise<CoinTransaction[]> => {
  const { data, error } = await supabase
    .from('coin_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

// Get gift statistics
export const getGiftStatistics = async (userId: string): Promise<{
  total_sent: number
  total_received: number
  coins_spent: number
  coins_earned: number
  favorite_gift: Gift | null
  most_generous_user: { username: string; avatar_url: string | null } | null
}> => {
  // Get sent gifts
  const { data: sentGifts } = await supabase
    .from('sent_gifts')
    .select(`
      *,
      gift:gifts(*)
    `)
    .eq('from_user_id', userId)

  // Get received gifts
  const { data: receivedGifts } = await supabase
    .from('sent_gifts')
    .select(`
      *,
      gift:gifts(*),
      from_profile:profiles!sent_gifts_from_user_id_fkey(username, avatar_url)
    `)
    .eq('to_user_id', userId)

  // Calculate statistics
  const totalSent = sentGifts?.length || 0
  const totalReceived = receivedGifts?.length || 0

  const coinsSpent = sentGifts?.reduce((sum, sg) => sum + (sg.gift?.cost_coins || 0), 0) || 0
  const coinsEarned = receivedGifts?.reduce((sum, rg) => 
    sum + Math.floor((rg.gift?.cost_coins || 0) * 0.1), 0
  ) || 0

  // Find favorite gift (most sent)
  const giftCounts = sentGifts?.reduce((acc, sg) => {
    const giftId = sg.gift_id
    acc[giftId] = (acc[giftId] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  const favoriteGiftId = Object.entries(giftCounts)
    .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0]

  const favoriteGift = favoriteGiftId ? 
    sentGifts?.find(sg => sg.gift_id === favoriteGiftId)?.gift || null : null

  // Find most generous user (who sent most gifts to this user)
  const senderCounts = receivedGifts?.reduce((acc, rg) => {
    const senderId = rg.from_user_id
    acc[senderId] = (acc[senderId] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  const mostGenerousUserId = Object.entries(senderCounts)
    .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0]

  const mostGenerousUser = mostGenerousUserId ?
    receivedGifts?.find(rg => rg.from_user_id === mostGenerousUserId)?.from_profile || null : null

  return {
    total_sent: totalSent,
    total_received: totalReceived,
    coins_spent: coinsSpent,
    coins_earned: coinsEarned,
    favorite_gift: favoriteGift,
    most_generous_user: mostGenerousUser ? {
      username: mostGenerousUser.username,
      avatar_url: mostGenerousUser.avatar_url
    } : null
  }
}

// Get trending gifts (most sent in last 7 days)
export const getTrendingGifts = async (limit: number = 10): Promise<{
  gift: Gift
  sent_count: number
}[]> => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('sent_gifts')
    .select(`
      gift_id,
      gift:gifts(*)
    `)
    .gte('created_at', sevenDaysAgo)

  if (error) throw error

  // Count gifts by ID
  const giftCounts: Record<string, { gift: Gift; count: number }> = {}
  
  ;(data || []).forEach(sg => {
    const giftId = sg.gift_id
    if (!giftCounts[giftId]) {
      giftCounts[giftId] = { gift: sg.gift as unknown as Gift, count: 0 }
    }
    giftCounts[giftId].count++
  })

  // Sort by count and limit
  return Object.values(giftCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map(({ gift, count }) => ({
      gift,
      sent_count: count
    }))
}

// Get gift recommendations based on user's history and preferences
export const getGiftRecommendations = async (
  userId: string,
  limit: number = 5
): Promise<Gift[]> => {
  // Get user's gift sending history
  const { data: sentGifts } = await supabase
    .from('sent_gifts')
    .select('gift_id')
    .eq('from_user_id', userId)

  const sentGiftIds = sentGifts?.map(sg => sg.gift_id) || []

  // Get user's profile for preferences
  const { data: profile } = await supabase
    .from('profiles')
    .select('coins_balance, vip_tier')
    .eq('id', userId)
    .single()

  if (!profile) return []

  // Get available gifts that user hasn't sent recently
  const { data: availableGifts } = await supabase
    .from('gifts')
    .select('*')
    .eq('is_active', true)
    .lte('cost_coins', profile.coins_balance)
    .order('cost_coins', { ascending: true })

  if (!availableGifts) return []

  // Filter out already sent gifts and prioritize by user's VIP tier
  let filtered = availableGifts.filter(gift => !sentGiftIds.includes(gift.id))

  // Prioritize gifts based on VIP tier
  if (profile.vip_tier === 'diamond') {
    // Show all tiers
  } else if (profile.vip_tier === 'platinum') {
    filtered = filtered.filter(g => g.tier !== 'legendary')
  } else if (profile.vip_tier === 'premium') {
    filtered = filtered.filter(g => !['legendary', 'serious'].includes(g.tier))
  } else {
    filtered = filtered.filter(g => ['everyday', 'romantic'].includes(g.tier))
  }

  return filtered.slice(0, limit)
}

// Real-world gift fulfillment (for partners)
export const fulfillRealWorldGift = async (
  sentGiftId: string,
  fulfillmentData: {
    tracking_number?: string
    delivery_address?: string
    status: 'pending' | 'shipped' | 'delivered'
    notes?: string
  }
): Promise<SentGift> => {
  const { data, error } = await supabase
    .from('sent_gifts')
    .update({
      fulfillment_data: fulfillmentData,
      updated_at: new Date().toISOString()
    })
    .eq('id', sentGiftId)
    .select()
    .single()

  if (error) throw error
  return data!
}
