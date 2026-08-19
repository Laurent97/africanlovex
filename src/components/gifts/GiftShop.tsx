import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { 
  Coins, 
  Heart, 
  Star, 
  Crown, 
  Diamond, 
  TrendingUp, 
  Gift, 
  X 
} from 'lucide-react'
import { getGiftsByTier, sendGift, getUserCoinBalance, getTrendingGifts } from '@/lib/gifts'
import { getCurrentUser } from '@/lib/auth'
import type { Database } from '@/lib/supabase'

type Gift = Database['public']['Tables']['gifts']['Row']

interface GiftShopProps {
  recipientId?: string
  onGiftSent?: (gift: Gift) => void
  onClose?: () => void
}

export const GiftShop: React.FC<GiftShopProps> = ({
  recipientId,
  onGiftSent,
  onClose
}) => {
  const [gifts, setGifts] = useState<{
    everyday: Gift[]
    romantic: Gift[]
    serious: Gift[]
    legendary: Gift[]
    real_world: Gift[]
  }>({
    everyday: [],
    romantic: [],
    serious: [],
    legendary: [],
    real_world: []
  })

  const [trendingGifts, setTrendingGifts] = useState<{
    gift: Gift
    sent_count: number
  }[]>([])

  const [userBalance, setUserBalance] = useState(0)
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState('everyday')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadGifts()
    loadUserBalance()
    loadTrendingGifts()
  }, [])

  const loadGifts = async () => {
    try {
      const giftsData = await getGiftsByTier()
      setGifts(giftsData)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to load gifts')
    }
  }

  const loadUserBalance = async () => {
    try {
      const user = await getCurrentUser()
      if (user) {
        const balance = await getUserCoinBalance(user.id)
        setUserBalance(balance)
      }
    } catch (error: unknown) {
      console.error('Error loading balance:', error)
    }
  }

  const loadTrendingGifts = async () => {
    try {
      const trending = await getTrendingGifts(5)
      setTrendingGifts(trending)
    } catch (error: unknown) {
      console.error('Error loading trending gifts:', error)
    }
  }

  const handleSendGift = async () => {
    if (!selectedGift || !recipientId) return

    const user = await getCurrentUser()
    if (!user) {
      setError('You must be logged in to send gifts')
      return
    }

    if (userBalance < selectedGift.cost_coins) {
      setError('Insufficient coins. Please purchase more coins.')
      return
    }

    setSending(true)
    setError('')
    setSuccess('')

    try {
      await sendGift(user.id, recipientId, selectedGift.id, message)
      setSuccess(`Gift sent successfully! ${selectedGift.cost_coins} coins deducted.`)

      setUserBalance(prev => prev - selectedGift.cost_coins)

      setSelectedGift(null)
      setMessage('')

      onGiftSent?.(selectedGift)

      setTimeout(() => {
        onClose?.()
      }, 2000)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to send gift')
    } finally {
      setSending(false)
    }
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'everyday': return <Heart className="w-3.5 h-3.5" />
      case 'romantic': return <Star className="w-3.5 h-3.5" />
      case 'serious': return <Crown className="w-3.5 h-3.5" />
      case 'legendary': return <Diamond className="w-3.5 h-3.5" />
      case 'real_world': return <Gift className="w-3.5 h-3.5" />
      default: return <Heart className="w-3.5 h-3.5" />
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'everyday': return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'
      case 'romantic': return 'bg-sky-100 text-sky-800 hover:bg-sky-100'
      case 'serious': return 'bg-violet-100 text-violet-800 hover:bg-violet-100'
      case 'legendary': return 'bg-amber-100 text-amber-800 hover:bg-amber-100'
      case 'real_world': return 'bg-rose-100 text-rose-800 hover:bg-rose-100'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const formatTierLabel = (tier: string) => tier.replace('_', ' ')

  const GiftCard = ({ gift, isTrending = false }: { gift: Gift; isTrending?: boolean }) => (
    <Card
      className={`group relative cursor-pointer overflow-hidden border bg-card transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] ${
        selectedGift?.id === gift.id ? 'ring-2 ring-love-red ring-offset-2' : ''
      }`}
      onClick={() => setSelectedGift(gift)}
      role="button"
      aria-pressed={selectedGift?.id === gift.id}
    >
      <CardContent className="p-3">
        <div className="relative aspect-square mb-3 rounded-2xl bg-muted/50 overflow-hidden flex items-center justify-center">
          {gift.icon_url ? (
            <img
              src={gift.icon_url}
              alt={gift.name}
              className="w-full h-full object-contain p-3"
            />
          ) : (
            <Gift className="w-10 h-10 text-muted-foreground" />
          )}
        </div>

        <h3 className="font-semibold text-sm truncate">{gift.name}</h3>
        <p className="text-xs text-muted-foreground truncate">{gift.name_local}</p>

        <div className="mt-3 flex items-center justify-between gap-2">
          <Badge variant="secondary" className={getTierColor(gift.tier)}>
            {getTierIcon(gift.tier)}
            <span className="ml-1 capitalize text-[10px]">{formatTierLabel(gift.tier)}</span>
          </Badge>

          <div className="flex items-center text-love-red font-bold text-sm shrink-0">
            <Coins className="w-3.5 h-3.5 mr-1" />
            {gift.cost_coins}
          </div>
        </div>
      </CardContent>

      {isTrending && (
        <Badge className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] gap-1">
          <TrendingUp className="w-3 h-3" />
          Trending
        </Badge>
      )}
    </Card>
  )

  const tiers: (keyof typeof gifts)[] = ['everyday', 'romantic', 'serious', 'legendary', 'real_world']

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-muted-foreground">Loading gifts...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Gift Shop</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Find the perfect gift to make them smile.
          </p>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <Card className="border-love-red/20 bg-love-red/5">
            <CardContent className="px-4 py-2 flex items-center gap-2">
              <Coins className="h-5 w-5 text-love-red" />
              <span className="font-bold">{userBalance.toLocaleString()}</span>
            </CardContent>
          </Card>

          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Trending Gifts */}
      {trendingGifts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-orange-500" />
            <h2 className="font-semibold">Trending now</h2>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            {trendingGifts.map((item, index) => (
              <div key={item.gift.id} className="min-w-[9.5rem] w-[9.5rem] relative">
                <GiftCard gift={item.gift} isTrending={true} />
                <Badge className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px]">
                  #{index + 1}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gift Categories */}
      <Card className="border shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="flex w-full h-auto justify-start gap-1 overflow-x-auto rounded-full bg-muted/60 p-1">
              {tiers.map(tier => (
                <TabsTrigger
                  key={tier}
                  value={tier}
                  className="rounded-full capitalize gap-1.5 text-xs sm:text-sm whitespace-nowrap"
                >
                  {getTierIcon(tier)}
                  {formatTierLabel(tier)}
                </TabsTrigger>
              ))}
            </TabsList>

            {tiers.map(tier => (
              <TabsContent key={tier} value={tier} className="mt-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {gifts[tier].map(gift => (
                    <GiftCard key={gift.id} gift={gift} />
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Selected Gift Details & Send */}
      {selectedGift && (
        <Card className="sticky bottom-4 z-20 border-love-red/20 shadow-2xl bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 rounded-2xl">
          <CardContent className="p-4 sm:p-5 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 shrink-0 rounded-2xl bg-muted/50 overflow-hidden flex items-center justify-center">
                {selectedGift.icon_url ? (
                  <img
                    src={selectedGift.icon_url}
                    alt={selectedGift.name}
                    className="w-full h-full object-contain p-3"
                  />
                ) : (
                  <Gift className="w-10 h-10 text-muted-foreground" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-lg leading-tight">{selectedGift.name}</h3>
                    <p className="text-xs text-muted-foreground">{selectedGift.name_local}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedGift(null)}
                    className="h-8 px-2 text-muted-foreground"
                  >
                    Clear
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {selectedGift.description}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className={getTierColor(selectedGift.tier)}>
                    {getTierIcon(selectedGift.tier)}
                    <span className="ml-1 capitalize">{formatTierLabel(selectedGift.tier)}</span>
                  </Badge>
                  <div className="flex items-center text-love-red font-bold text-sm">
                    <Coins className="w-4 h-4 mr-1" />
                    {selectedGift.cost_coins}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="gift-message" className="text-sm font-medium">
                Add a personal message (optional)
              </label>
              <Textarea
                id="gift-message"
                placeholder="Write something sweet..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={200}
                rows={3}
              />
              <p className="text-xs text-muted-foreground text-right">
                {message.length}/200
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Your balance:{' '}
                <span className="font-semibold text-love-red">{userBalance} coins</span>
              </p>

              <Button
                onClick={handleSendGift}
                disabled={sending || userBalance < selectedGift.cost_coins}
                className="w-full sm:w-auto bg-love-red hover:bg-love-red/90 text-white"
              >
                {sending ? 'Sending...' : `Send for ${selectedGift.cost_coins} coins`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
