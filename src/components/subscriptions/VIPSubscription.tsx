import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Crown, 
  Star, 
  CheckCircle, 
  Gift, 
  Users, 
  Shield, 
  Heart,
  Loader2,
  TrendingUp,
  Calendar,
  DollarSign
} from 'lucide-react'
import { 
  getAllSubscriptionTiers, 
  getUserSubscription, 
  createSubscription, 
  upgradeSubscription,
  getSubscriptionSavings,
  hasPremiumFeature,
  getSubscriptionAnalytics
} from '@/lib/subscriptions'
import { getCurrentUser } from '@/lib/auth'
import type { SubscriptionTier } from '@/lib/subscriptions'

interface VIPSubscriptionProps {
  onSubscriptionComplete?: (result: any) => void
  onCancel?: () => void
  selectedTier?: string
}

export const VIPSubscription: React.FC<VIPSubscriptionProps> = ({
  onSubscriptionComplete,
  onCancel,
  selectedTier = 'premium'
}) => {
  const [tiers, setTiers] = useState<SubscriptionTier[]>([])
  const [currentSubscription, setCurrentSubscription] = useState<any>(null)
  const [selectedTierId, setSelectedTierId] = useState(selectedTier)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [analytics, setAnalytics] = useState<any>(null)

  useEffect(() => {
    loadTiers()
    loadUserSubscription()
    loadAnalytics()
  }, [])

  const loadTiers = () => {
    setTiers(getAllSubscriptionTiers())
  }

  const loadUserSubscription = async () => {
    try {
      const user = await getCurrentUser()
      if (user) {
        const subscription = await getUserSubscription(user.id)
        setCurrentSubscription(subscription)
        if (subscription) {
          setSelectedTierId(subscription.tier)
        }
      }
    } catch (error: any) {
      console.error('Error loading subscription:', error)
    }
  }

  const loadAnalytics = async () => {
    try {
      const user = await getCurrentUser()
      if (user) {
        const userAnalytics = await getSubscriptionAnalytics(user.id)
        setAnalytics(userAnalytics)
      }
    } catch (error: any) {
      console.error('Error loading analytics:', error)
    }
  }

  const handleSubscribe = async (tierId: string) => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const user = await getCurrentUser()
      if (!user) {
        setError('You must be logged in to subscribe')
        return
      }

      if (currentSubscription && currentSubscription.tier === tierId) {
        setError('You are already subscribed to this tier')
        return
      }

      const result = await upgradeSubscription(user.id, tierId as any, 'stripe_card')
      
      if (result.success) {
        setSuccess('Subscription upgraded successfully!')
        await loadUserSubscription()
        onSubscriptionComplete?.(result)
      } else {
        setError('Failed to process subscription. Please try again.')
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred while processing your subscription')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!currentSubscription) return

    setLoading(true)
    try {
      const user = await getCurrentUser()
      if (!user) return

      // In a real implementation, this would call the payment provider to cancel
      // For now, we'll just show a message
      setSuccess('Subscription cancellation request received. You will continue to have access until the end of your billing period.')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number, currency: string, billingCycle: 'monthly' | 'yearly') => {
    const multiplier = billingCycle === 'yearly' ? 12 : 1
    const totalPrice = price * multiplier
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(totalPrice)
  }

  const getSavings = (tier: SubscriptionTier) => {
    const savings = getSubscriptionSavings(tier.id, billingCycle === 'yearly' ? 12 : 1)
    return savings
  }

  const FeatureCheck = ({ feature, tier }: { feature: keyof SubscriptionTier['benefits']; tier: SubscriptionTier }) => {
    const hasFeature = tier.benefits[feature]
    return hasFeature ? (
      <div className="flex items-center text-sm">
        <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
        <span>{getFeatureDescription(feature)}</span>
      </div>
    ) : (
      <div className="flex items-center text-sm text-muted-foreground">
        <div className="w-4 h-4 mr-2 border border-gray-300 rounded-full"></div>
        <span>{getFeatureDescription(feature)}</span>
      </div>
    )
  }

  const getFeatureDescription = (feature: keyof SubscriptionTier['benefits']): string => {
    const descriptions = {
      unlimited_swipes: 'Unlimited swipes',
      see_who_liked: 'See who liked you',
      free_boosts_per_week: 'Free boosts per week',
      send_voice_messages: 'Send voice messages',
      no_ads: 'No advertisements',
      unlimited_rewind: 'Unlimited rewind',
      read_receipts: 'Read receipts',
      priority_support: 'Priority customer support',
      exclusive_gifts: 'Exclusive gift animations',
      vip_badge: 'VIP badge on profile',
      top_search_ranking: 'Top search ranking',
      private_mode: 'Private mode (hide from non-VIP)',
      monthly_coins_bonus: 'Monthly bonus coins',
      exclusive_events: 'Access to exclusive virtual events',
      personal_matchmaker: 'Personal matchmaker service',
      real_gift_concierge: 'Real gift delivery concierge',
      featured_profile: 'Featured on "Elite Singles"',
      vip_mixers: 'Invitation to VIP mixers'
    }
    return descriptions[feature] || feature
  }

  const TierCard = ({ tier, isCurrent, isUpgrade }: { 
    tier: SubscriptionTier; 
    isCurrent: boolean; 
    isUpgrade: boolean 
  }) => {
    const savings = getSavings(tier)
    
    return (
      <Card className={`relative overflow-hidden transition-all ${
        isCurrent ? 'ring-2 ring-love-red' : 
        isUpgrade ? 'hover:shadow-lg border-love-red' : 
        'hover:shadow-md'
      }`}>
        {tier.id === 'diamond' && (
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400"></div>
        )}
        
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">{tier.icon}</div>
              <div>
                <CardTitle className="text-xl">{tier.name}</CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge className={tier.color}>
                    {tier.id.toUpperCase()}
                  </Badge>
                  {isCurrent && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Current Plan
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-love-red">
                {formatPrice(tier.price, tier.currency, billingCycle)}
              </div>
              {billingCycle === 'yearly' && savings.percentage_savings > 0 && (
                <div className="text-sm text-green-600">
                  Save {savings.percentage_savings}%
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Features */}
          <div className="space-y-3">
            <h4 className="font-semibold">Features:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FeatureCheck feature="unlimited_swipes" tier={tier} />
              <FeatureCheck feature="see_who_liked" tier={tier} />
              <FeatureCheck feature="free_boosts_per_week" tier={tier} />
              <FeatureCheck feature="send_voice_messages" tier={tier} />
              <FeatureCheck feature="no_ads" tier={tier} />
              <FeatureCheck feature="unlimited_rewind" tier={tier} />
              <FeatureCheck feature="read_receipts" tier={tier} />
              <FeatureCheck feature="priority_support" tier={tier} />
              <FeatureCheck feature="exclusive_gifts" tier={tier} />
              <FeatureCheck feature="vip_badge" tier={tier} />
              <FeatureCheck feature="top_search_ranking" tier={tier} />
              <FeatureCheck feature="private_mode" tier={tier} />
              <FeatureCheck feature="monthly_coins_bonus" tier={tier} />
              <FeatureCheck feature="exclusive_events" tier={tier} />
              <FeatureCheck feature="personal_matchmaker" tier={tier} />
              <FeatureCheck feature="real_gift_concierge" tier={tier} />
              <FeatureCheck feature="featured_profile" tier={tier} />
              <FeatureCheck feature="vip_mixers" tier={tier} />
            </div>
          </div>

          {/* Bonus Coins */}
          {tier.coins_bonus > 0 && (
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center text-yellow-800">
                <Gift className="w-5 h-5 mr-2" />
                <span className="font-medium">
                  {tier.coins_bonus.toLocaleString()} bonus coins monthly
                </span>
              </div>
            </div>
          )}
        </CardContent>

        <CardContent className="pt-0">
          <Button 
            className="w-full" 
            variant={isCurrent ? "outline" : "default"}
            onClick={() => handleSubscribe(tier.id)}
            disabled={loading || isCurrent}
          >
            {isCurrent ? 'Current Plan' : 
             isUpgrade ? `Upgrade to ${tier.name}` : 'Choose Plan'}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Crown className="w-6 h-6 mr-2 text-love-gold" />
            LoveX VIP Membership
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Unlock exclusive features and get the most out of your LoveX experience. 
            Choose the plan that best fits your dating goals.
          </p>
        </CardContent>
      </Card>

      {/* Current Subscription Status */}
      {currentSubscription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Current Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">
                  {getAllSubscriptionTiers().find(t => t.id === currentSubscription.tier)?.icon}
                </div>
                <div>
                  <div className="font-semibold">
                    {getAllSubscriptionTiers().find(t => t.id === currentSubscription.tier)?.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Renews on {new Date(currentSubscription.end_date).toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel Subscription
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing Cycle Toggle */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Cycle</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={billingCycle} onValueChange={(value: any) => setBillingCycle(value)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly">
                Yearly 
                <Badge className="ml-2 bg-green-100 text-green-800">
                  Save up to 20%
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Subscription Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tiers.map(tier => {
          const isCurrent = currentSubscription?.tier === tier.id
          const isUpgrade = currentSubscription && 
            tiers.indexOf(tier) > tiers.findIndex(t => t.id === currentSubscription.tier)
          
          return (
            <TierCard 
              key={tier.id} 
              tier={tier} 
              isCurrent={isCurrent}
              isUpgrade={isUpgrade}
            />
          )
        })}
      </div>

      {/* Analytics */}
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Your Subscription Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <DollarSign className="w-8 h-8 mx-auto mb-2 text-love-red" />
                <div className="text-2xl font-bold">
                  ${analytics.total_spent.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">Total Spent</div>
              </div>
              
              <div className="text-center p-4 bg-muted rounded-lg">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-love-purple" />
                <div className="text-2xl font-bold">
                  {analytics.months_subscribed}
                </div>
                <div className="text-sm text-muted-foreground">Months Subscribed</div>
              </div>
              
              <div className="text-center p-4 bg-muted rounded-lg">
                <Users className="w-8 h-8 mx-auto mb-2 text-love-gold" />
                <div className="text-lg font-bold capitalize">
                  {analytics.current_tier || 'Free'}
                </div>
                <div className="text-sm text-muted-foreground">Current Tier</div>
              </div>
              
              <div className="text-center p-4 bg-muted rounded-lg">
                <Heart className="w-8 h-8 mx-auto mb-2 text-pink-500" />
                <div className="space-y-1">
                  {analytics.favorite_features.map((feature: string, index) => (
                    <div key={index} className="text-xs">
                      {getFeatureDescription(feature as any)}
                    </div>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">Most Used Features</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert>
          <AlertDescription className="flex items-center">
            <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
            {success}
          </AlertDescription>
        </Alert>
      )}

      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6">
            <CardContent className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p>Processing your subscription...</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
