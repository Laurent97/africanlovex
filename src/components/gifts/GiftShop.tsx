import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Coins, Heart, Star, Crown, Diamond, TrendingUp, Gift } from 'lucide-react'
import { getGiftsByTier, sendGift, getUserCoinBalance, getTrendingGifts } from '@/lib/gifts'
import { getCurrentUser } from '@/lib/auth'
import type { Database } from '@/lib/supabase'

type Gift = Database['public']['Tables']['gifts']['Row']

interface GiftShopProps {
  recipientId?: string
  onGiftSent?: (gift: any) => void
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
    } catch (error: any) {
      setError(error.message)
    }
  }

  const loadUserBalance = async () => {
    try {
      const user = await getCurrentUser()
      if (user) {
        const balance = await getUserCoinBalance(user.id)
        setUserBalance(balance)
      }
    } catch (error: any) {
      console.error('Error loading balance:', error)
    }
  }

  const loadTrendingGifts = async () => {
    try {
      const trending = await getTrendingGifts(5)
      setTrendingGifts(trending)
    } catch (error: any) {
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
      
      // Update balance
      setUserBalance(prev => prev - selectedGift.cost_coins)
      
      // Reset form
      setSelectedGift(null)
      setMessage('')
      
      onGiftSent?.(selectedGift)
      
      // Close after a delay
      setTimeout(() => {
        onClose?.()
      }, 2000)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setSending(false)
    }
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'everyday': return <Heart className="w-4 h-4" />
      case 'romantic': return <Star className="w-4 h-4" />
      case 'serious': return <Crown className="w-4 h-4" />
      case 'legendary': return <Diamond className="w-4 h-4" />
      case 'real_world': return <Gift className="w-4 h-4" />
      default: return <Heart className="w-4 h-4" />
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'everyday': return 'bg-green-100 text-green-800'
      case 'romantic': return 'bg-blue-100 text-blue-800'
      case 'serious': return 'bg-purple-100 text-purple-800'
      case 'legendary': return 'bg-yellow-100 text-yellow-800'
      case 'real_world': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const GiftCard = ({ gift, isTrending = false }: { gift: Gift; isTrending?: boolean }) => (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        selectedGift?.id === gift.id ? 'ring-2 ring-love-red' : ''
      }`}
      onClick={() => setSelectedGift(gift)}
    >
      <CardContent className="p-4">
        <div className="relative">
          {isTrending && (
            <Badge className="absolute -top-2 -right-2 bg-orange-100 text-orange-800">
              <TrendingUp className="w-3 h-3 mr-1" />
              Trending
            </Badge>
          )}
          
          <div className="text-center mb-3">
            {gift.icon_url ? (
              <img 
                src={gift.icon_url} 
                alt={gift.name}
                className="w-16 h-16 mx-auto object-contain"
              />
            ) : (
              <div className="w-16 h-16 mx-auto bg-muted rounded-lg flex items-center justify-center">
                <Gift className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
          </div>
          
          <h3 className="font-semibold text-center mb-1">{gift.name}</h3>
          <p className="text-xs text-muted-foreground text-center mb-2">{gift.name_local}</p>
          
          <div className="flex items-center justify-between">
            <Badge className={getTierColor(gift.tier)}>
              {getTierIcon(gift.tier)}
              <span className="ml-1 capitalize">{gift.tier}</span>
            </Badge>
            
            <div className="flex items-center text-love-red font-bold">
              <Coins className="w-4 h-4 mr-1" />
              {gift.cost_coins}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse">Loading gifts...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>LoveX Gift Shop 💝</CardTitle>
              <CardDescription>Send beautiful gifts to express your feelings</CardDescription>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Your Balance</div>
                <div className="text-xl font-bold text-love-red flex items-center">
                  <Coins className="w-5 h-5 mr-1" />
                  {userBalance.toLocaleString()}
                </div>
              </div>
              
              {onClose && (
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-orange-500" />
              Trending Gifts
            </CardTitle>
            <CardDescription>Most popular gifts this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {trendingGifts.map((item, index) => (
                <div key={item.gift.id} className="relative">
                  <GiftCard gift={item.gift} isTrending={true} />
                  <Badge className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs">
                    #{index + 1}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gift Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Choose a Gift</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="everyday">Everyday</TabsTrigger>
              <TabsTrigger value="romantic">Romantic</TabsTrigger>
              <TabsTrigger value="serious">Serious</TabsTrigger>
              <TabsTrigger value="legendary">Legendary</TabsTrigger>
              <TabsTrigger value="real_world">Real World</TabsTrigger>
            </TabsList>

            <TabsContent value="everyday" className="mt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {gifts.everyday.map(gift => (
                  <GiftCard key={gift.id} gift={gift} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="romantic" className="mt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {gifts.romantic.map(gift => (
                  <GiftCard key={gift.id} gift={gift} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="serious" className="mt-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {gifts.serious.map(gift => (
                  <GiftCard key={gift.id} gift={gift} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="legendary" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gifts.legendary.map(gift => (
                  <GiftCard key={gift.id} gift={gift} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="real_world" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gifts.real_world.map(gift => (
                  <GiftCard key={gift.id} gift={gift} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Selected Gift Details & Send */}
      {selectedGift && (
        <Card>
          <CardHeader>
            <CardTitle>Send Gift</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              {selectedGift.icon_url ? (
                <img 
                  src={selectedGift.icon_url} 
                  alt={selectedGift.name}
                  className="w-20 h-20 object-contain"
                />
              ) : (
                <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                  <Gift className="w-10 h-10 text-muted-foreground" />
                </div>
              )}
              
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{selectedGift.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedGift.name_local}</p>
                <p className="text-sm mt-2">{selectedGift.description}</p>
                
                <div className="flex items-center justify-between mt-3">
                  <Badge className={getTierColor(selectedGift.tier)}>
                    {getTierIcon(selectedGift.tier)}
                    <span className="ml-1 capitalize">{selectedGift.tier}</span>
                  </Badge>
                  
                  <div className="flex items-center text-lg font-bold text-love-red">
                    <Coins className="w-5 h-5 mr-1" />
                    {selectedGift.cost_coins}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="gift-message" className="text-sm font-medium">
                Personal Message (optional)
              </label>
              <textarea
                id="gift-message"
                className="w-full p-3 border rounded-md resize-none"
                rows={3}
                placeholder="Write a sweet message to accompany your gift..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground text-right">
                {message.length}/200
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Your balance: <span className="font-bold text-love-red">{userBalance} coins</span>
              </div>
              
              <Button 
                onClick={handleSendGift}
                disabled={sending || userBalance < selectedGift.cost_coins}
                className="bg-love-red hover:bg-love-red/90"
              >
                {sending ? 'Sending...' : `Send Gift (${selectedGift.cost_coins} coins)`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
