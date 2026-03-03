import { supabase } from './supabase'
import type { Database } from './supabase'

type Subscription = Database['public']['Tables']['subscriptions']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

export interface SubscriptionTier {
  id: 'basic' | 'premium' | 'platinum' | 'diamond'
  name: string
  price: number
  currency: string
  duration_months: number
  features: string[]
  icon: string
  color: string
  coins_bonus: number
  benefits: {
    unlimited_swipes: boolean
    see_who_liked: boolean
    free_boosts_per_week: number
    send_voice_messages: boolean
    no_ads: boolean
    unlimited_rewind: boolean
    read_receipts: boolean
    priority_support: boolean
    exclusive_gifts: boolean
    vip_badge: boolean
    top_search_ranking: boolean
    private_mode: boolean
    monthly_coins_bonus: number
    exclusive_events: boolean
    personal_matchmaker: boolean
    real_gift_concierge: boolean
    featured_profile: boolean
    vip_mixers: boolean
  }
}

export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: 'basic',
    name: 'LoveX Basic',
    price: 4.99,
    currency: 'USD',
    duration_months: 1,
    features: [
      'Unlimited swipes',
      'See who liked you',
      '1 free boost per week',
      'Send voice messages',
      'No advertisements'
    ],
    icon: '🌟',
    color: 'bg-blue-100 text-blue-800',
    coins_bonus: 0,
    benefits: {
      unlimited_swipes: true,
      see_who_liked: true,
      free_boosts_per_week: 1,
      send_voice_messages: true,
      no_ads: true,
      unlimited_rewind: false,
      read_receipts: false,
      priority_support: false,
      exclusive_gifts: false,
      vip_badge: false,
      top_search_ranking: false,
      private_mode: false,
      monthly_coins_bonus: 0,
      exclusive_events: false,
      personal_matchmaker: false,
      real_gift_concierge: false,
      featured_profile: false,
      vip_mixers: false
    }
  },
  {
    id: 'premium',
    name: 'LoveX Premium',
    price: 9.99,
    currency: 'USD',
    duration_months: 1,
    features: [
      'All Basic features',
      'Unlimited rewind',
      '5 free boosts per week',
      'See read receipts',
      'Priority customer support',
      'Exclusive gift animations'
    ],
    icon: '💎',
    color: 'bg-purple-100 text-purple-800',
    coins_bonus: 500,
    benefits: {
      unlimited_swipes: true,
      see_who_liked: true,
      free_boosts_per_week: 5,
      send_voice_messages: true,
      no_ads: true,
      unlimited_rewind: true,
      read_receipts: true,
      priority_support: true,
      exclusive_gifts: true,
      vip_badge: false,
      top_search_ranking: false,
      private_mode: false,
      monthly_coins_bonus: 500,
      exclusive_events: false,
      personal_matchmaker: false,
      real_gift_concierge: false,
      featured_profile: false,
      vip_mixers: false
    }
  },
  {
    id: 'platinum',
    name: 'LoveX Platinum',
    price: 19.99,
    currency: 'USD',
    duration_months: 1,
    features: [
      'All Premium features',
      'VIP badge on profile',
      'Top search ranking',
      'Private mode (hide from non-VIP)',
      '500 bonus coins monthly',
      'Access to exclusive virtual events'
    ],
    icon: '👑',
    color: 'bg-yellow-100 text-yellow-800',
    coins_bonus: 500,
    benefits: {
      unlimited_swipes: true,
      see_who_liked: true,
      free_boosts_per_week: 10,
      send_voice_messages: true,
      no_ads: true,
      unlimited_rewind: true,
      read_receipts: true,
      priority_support: true,
      exclusive_gifts: true,
      vip_badge: true,
      top_search_ranking: true,
      private_mode: true,
      monthly_coins_bonus: 500,
      exclusive_events: true,
      personal_matchmaker: false,
      real_gift_concierge: false,
      featured_profile: false,
      vip_mixers: false
    }
  },
  {
    id: 'diamond',
    name: 'LoveX Diamond',
    price: 49.99,
    currency: 'USD',
    duration_months: 1,
    features: [
      'All Platinum features',
      'Personal matchmaker service',
      'Real gift delivery concierge',
      'Featured on "Elite Singles" section',
      'Invitation to VIP mixers (real events)',
      'Highest verification priority'
    ],
    icon: '💍',
    color: 'bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800',
    coins_bonus: 2000,
    benefits: {
      unlimited_swipes: true,
      see_who_liked: true,
      free_boosts_per_week: 20,
      send_voice_messages: true,
      no_ads: true,
      unlimited_rewind: true,
      read_receipts: true,
      priority_support: true,
      exclusive_gifts: true,
      vip_badge: true,
      top_search_ranking: true,
      private_mode: true,
      monthly_coins_bonus: 2000,
      exclusive_events: true,
      personal_matchmaker: true,
      real_gift_concierge: true,
      featured_profile: true,
      vip_mixers: true
    }
  }
]

// Get subscription tier by ID
export const getSubscriptionTier = (tierId: string): SubscriptionTier | null => {
  const tier = SUBSCRIPTION_TIERS.find(t => t.id === tierId)
  if (!tier) throw new Error('Invalid subscription tier')

  return tier
}

// Get all subscription tiers
export const getAllSubscriptionTiers = (): SubscriptionTier[] => {
  return SUBSCRIPTION_TIERS
}

// Create or update subscription
export const createSubscription = async (
  userId: string,
  tierId: 'basic' | 'premium' | 'platinum' | 'diamond',
  paymentMethodId: string,
  durationMonths: number = 1
): Promise<Subscription> => {
  const tier = getSubscriptionTier(tierId)
  if (!tier) throw new Error('Invalid subscription tier')

  const startDate = new Date().toISOString()
  const endDate = new Date(Date.now() + durationMonths * 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      tier: tierId,
      status: 'active',
      start_date: startDate,
      end_date: endDate,
      amount: tier.price * durationMonths,
      currency: tier.currency,
      payment_method: paymentMethodId
    })
    .select()
    .single()

  if (error) throw error
  return data!
}

// Update user's VIP status in profile
export const updateUserVipStatus = async (
  userId: string,
  tierId: 'basic' | 'premium' | 'platinum' | 'diamond'
): Promise<void> => {
  const tier = getSubscriptionTier(tierId)
  if (!tier) throw new Error('Invalid subscription tier')

  // Update profile
  await supabase
    .from('profiles')
    .update({
      vip_tier: tierId,
      is_premium: tierId !== 'free',
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)

  // Add bonus coins if applicable
  if (tier.coins_bonus > 0) {
    await supabase.rpc('update_coins_balance', {
      user_uuid: userId,
      amount_change: tier.coins_bonus
    })

    await supabase
      .from('coin_transactions')
      .insert({
        user_id: userId,
        amount: tier.coins_bonus,
        transaction_type: 'bonus',
        description: `Monthly bonus - ${tier.name} subscription`,
        reference_id: null
      })
  }
}

// Get user's current subscription
export const getUserSubscription = async (
  userId: string
): Promise<Subscription | null> => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .single()

  if (error) {
    if (error.code !== 'PGRST116') throw error
    return null
  }

  // Check if subscription is still valid
  if (data && new Date(data.end_date) < new Date()) {
    // Update expired subscription
    await supabase
      .from('subscriptions')
      .update({
        status: 'expired',
        updated_at: new Date().toISOString()
      })
      .eq('id', data.id)

    // Update user profile
    await supabase
      .from('profiles')
      .update({
        vip_tier: 'free',
        is_premium: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    return null
  }

  return data
}

// Cancel subscription
export const cancelSubscription = async (
  userId: string,
  subscriptionId: string
): Promise<void> => {
  // Verify user owns the subscription
  const { data: subscription, error: checkError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', subscriptionId)
    .eq('user_id', userId)
    .single()

  if (checkError) throw checkError
  if (!subscription) throw new Error('Subscription not found')

  // Update subscription status
  const { error: updateError } = await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('id', subscriptionId)

  if (updateError) throw updateError

  // Update user profile (will take effect after subscription expires)
  // Keep current tier until end_date
}

// Reactivate cancelled subscription
export const reactivateSubscription = async (
  userId: string,
  subscriptionId: string,
  paymentMethodId: string
): Promise<Subscription> => {
  // Get subscription details
  const { data: subscription, error: checkError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', subscriptionId)
    .eq('user_id', userId)
    .single()

  if (checkError) throw checkError
  if (!subscription) throw new Error('Subscription not found')

  if (subscription.status !== 'cancelled') {
    throw new Error('Subscription is not cancelled')
  }

  // Reactivate subscription
  const newEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data, error: updateError } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      end_date: newEndDate,
      payment_method: paymentMethodId,
      updated_at: new Date().toISOString()
    })
    .eq('id', subscriptionId)
    .select()
    .single()

  if (updateError) throw updateError
  return data!
}

// Get subscription history
export const getSubscriptionHistory = async (
  userId: string,
  limit: number = 10
): Promise<Subscription[]> => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

// Check if user has access to premium feature
export const hasPremiumFeature = async (
  userId: string,
  feature: keyof SubscriptionTier['benefits']
): Promise<boolean> => {
  const subscription = await getUserSubscription(userId)
  if (!subscription) return false

  const tier = getSubscriptionTier(subscription.tier)
  if (!tier) return false

  return tier.benefits[feature] || false
}

// Get subscription savings (compared to monthly)
export const getSubscriptionSavings = (
  tierId: 'basic' | 'premium' | 'platinum' | 'diamond',
  months: number = 12
): { monthly_price: number; total_savings: number; percentage_savings: number } => {
  const tier = getSubscriptionTier(tierId)
  if (!tier) return { monthly_price: 0, total_savings: 0, percentage_savings: 0 }

  const monthlyPrice = tier.price
  const annualMonthlyPrice = monthlyPrice * 12 // Monthly price for annual comparison
  const totalPrice = monthlyPrice * months
  const standardPrice = 9.99 * months // Assuming Premium is the standard

  let totalSavings = 0
  let percentageSavings = 0

  if (months >= 12) {
    // Calculate annual savings
    const annualStandardPrice = 9.99 * 12
    const annualTierPrice = monthlyPrice * 12
    totalSavings = annualStandardPrice - annualTierPrice
    percentageSavings = Math.round((totalSavings / annualStandardPrice) * 100)
  }

  return {
    monthly_price: monthlyPrice,
    total_savings: totalSavings,
    percentage_savings: percentageSavings
  }
}

// Upgrade subscription
export const upgradeSubscription = async (
  userId: string,
  newTierId: 'premium' | 'platinum' | 'diamond',
  paymentMethodId: string
): Promise<{ success: boolean; newSubscription?: Subscription; proratedAmount?: number }> => {
  const currentSubscription = await getUserSubscription(userId)
  const newTier = getSubscriptionTier(newTierId)
  
  if (!newTier) throw new Error('Invalid subscription tier')

  let proratedAmount = 0

  // Calculate prorated amount if upgrading
  if (currentSubscription && currentSubscription.tier !== newTierId) {
    const currentTier = getSubscriptionTier(currentSubscription.tier as 'basic' | 'premium' | 'platinum' | 'diamond')
    if (currentTier) {
      const daysRemaining = Math.ceil(
        (new Date(currentSubscription.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
      const daysInMonth = 30
      const proratedCredit = (currentTier.price / daysInMonth) * daysRemaining
      
      proratedAmount = Math.max(0, newTier.price - proratedCredit)
    }
  }

  try {
    // Cancel current subscription
    if (currentSubscription) {
      await cancelSubscription(userId, currentSubscription.id)
    }

    // Create new subscription
    const newSubscription = await createSubscription(userId, newTierId, paymentMethodId)
    
    // Update user VIP status
    await updateUserVipStatus(userId, newTierId)

    return {
      success: true,
      newSubscription,
      proratedAmount
    }
  } catch (error: any) {
    return { success: false }
  }
}

// Get subscription analytics
export const getSubscriptionAnalytics = async (
  userId: string
): Promise<{
    current_tier: string | null
    total_spent: number
    months_subscribed: number
    favorite_features: string[]
  }> => {
  const history = await getSubscriptionHistory(userId, 100)
  const current = await getUserSubscription(userId)

  const totalSpent = history.reduce((sum, sub) => sum + sub.amount, 0)
  
  // Calculate total months subscribed
  const monthsSubscribed = history.reduce((sum, sub) => {
    const months = Math.ceil(
      (new Date(sub.end_date).getTime() - new Date(sub.start_date).getTime()) / (1000 * 60 * 60 * 24 * 30)
    )
    return sum + months
  }, 0)

  // This would be calculated from actual usage data
  const favoriteFeatures = [
    'unlimited_swipes',
    'see_who_liked',
    'free_boosts_per_week'
  ]

  return {
    current_tier: current?.tier || null,
    total_spent: totalSpent,
    months_subscribed: monthsSubscribed,
    favorite_features: favoriteFeatures
  }
}
