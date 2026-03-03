import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { MapPin, Calendar, Gift, Heart, Star, Crown } from 'lucide-react'
import type { Database } from '@/lib/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']

interface ProfileCardProps {
  profile: Profile
  onLike?: (userId: string) => void
  onPass?: (userId: string) => void
  onGift?: (userId: string) => void
  onMessage?: (userId: string) => void
  showActions?: boolean
  compact?: boolean
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  onLike,
  onPass,
  onGift,
  onMessage,
  showActions = true,
  compact = false
}) => {
  const getAgeDisplay = (age: number | null) => {
    if (!age) return ''
    return `${age} years`
  }

  const getLocationDisplay = (city: string | null, country: string | null) => {
    if (!city && !country) return ''
    if (city && country) return `${city}, ${country}`
    return city || country || ''
  }

  const getVerificationBadge = (level: string) => {
    const badges = {
      basic: { color: 'bg-gray-100 text-gray-800', icon: null, text: 'Basic' },
      standard: { color: 'bg-blue-100 text-blue-800', icon: Star, text: 'Verified' },
      premium: { color: 'bg-purple-100 text-purple-800', icon: Crown, text: 'Premium' }
    }
    
    const badge = badges[level as keyof typeof badges] || badges.basic
    const Icon = badge.icon
    
    return (
      <Badge className={badge.color}>
        {Icon && <Icon className="w-3 h-3 mr-1" />}
        {badge.text}
      </Badge>
    )
  }

  const getVipBadge = (tier: string) => {
    if (tier === 'free') return null
    
    const colors = {
      basic: 'bg-green-100 text-green-800',
      premium: 'bg-blue-100 text-blue-800',
      platinum: 'bg-purple-100 text-purple-800',
      diamond: 'bg-yellow-100 text-yellow-800'
    }
    
    return (
      <Badge className={colors[tier as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {tier.toUpperCase()}
      </Badge>
    )
  }

  const getRelationshipIntentionBadge = (intention: string | null) => {
    if (!intention) return null
    
    const intentions = {
      looking_for_love: { text: 'Ndi Mukundwa 💕', color: 'bg-pink-100 text-pink-800' },
      serious_only: { text: 'Serious Only 💍', color: 'bg-red-100 text-red-800' },
      friends_first: { text: 'Friends First 🤝', color: 'bg-blue-100 text-blue-800' },
      sugar_daddy: { text: 'Manzi 💰', color: 'bg-yellow-100 text-yellow-800' },
      sugar_mommy: { text: 'Mukwano 💰', color: 'bg-yellow-100 text-yellow-800' }
    }
    
    const intentionData = intentions[intention as keyof typeof intentions]
    if (!intentionData) return null
    
    return (
      <Badge className={intentionData.color}>
        {intentionData.text}
      </Badge>
    )
  }

  if (compact) {
    return (
      <Card className="w-full max-w-sm hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={profile.avatar_url || ''} alt={profile.username} />
              <AvatarFallback>
                {profile.username?.slice(0, 2).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold truncate">{profile.username}</h3>
                {profile.is_verified && getVerificationBadge(profile.verification_level)}
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {getLocationDisplay(profile.city, profile.country)}
              </p>
            </div>
            
            {showActions && (
              <div className="flex space-x-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onLike?.(profile.id)}
                >
                  <Heart className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-sm hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        {/* Profile Header */}
        <div className="flex flex-col items-center text-center mb-4">
          <div className="relative mb-4">
            <Avatar className="w-24 h-24">
              <AvatarImage src={profile.avatar_url || ''} alt={profile.username} />
              <AvatarFallback className="text-lg">
                {profile.username?.slice(0, 2).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            
            {/* Online indicator */}
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <h3 className="text-xl font-bold">{profile.username}</h3>
              {profile.is_verified && getVerificationBadge(profile.verification_level)}
              {getVipBadge(profile.vip_tier)}
            </div>
            
            <p className="text-lg font-medium text-muted-foreground">
              {profile.full_name}
            </p>
            
            <div className="flex items-center justify-center text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 mr-1" />
              {getLocationDisplay(profile.city, profile.country)}
            </div>
            
            {profile.age && (
              <div className="flex items-center justify-center text-sm text-muted-foreground">
                <Calendar className="w-4 h-4 mr-1" />
                {getAgeDisplay(profile.age)}
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground line-clamp-3">
              {profile.bio}
            </p>
          </div>
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {getRelationshipIntentionBadge(profile.relationship_intention)}
          
          {profile.languages && profile.languages.length > 0 && (
            <Badge variant="outline">
              {profile.languages.slice(0, 2).join(', ')}
              {profile.languages.length > 2 && ` +${profile.languages.length - 2}`}
            </Badge>
          )}
          
          {profile.interests && profile.interests.length > 0 && (
            <Badge variant="outline">
              {profile.interests.slice(0, 2).join(', ')}
              {profile.interests.length > 2 && ` +${profile.interests.length - 2}`}
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="flex justify-around py-3 border-t border-b mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-love-red">
              {profile.coins_balance || 0}
            </div>
            <div className="text-xs text-muted-foreground">Coins</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-love-purple">
              {/* This would come from a stats query */}
              0
            </div>
            <div className="text-xs text-muted-foreground">Matches</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-love-gold">
              {/* This would come from a stats query */}
              0
            </div>
            <div className="text-xs text-muted-foreground">Gifts</div>
          </div>
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={() => onPass?.(profile.id)}
            >
              Pass
            </Button>
            
            <Button
              className="bg-love-red hover:bg-love-red/90"
              onClick={() => onLike?.(profile.id)}
            >
              <Heart className="w-4 h-4 mr-2" />
              Like
            </Button>
            
            <Button
              variant="outline"
              onClick={() => onGift?.(profile.id)}
            >
              <Gift className="w-4 h-4 mr-2" />
              Gift
            </Button>
            
            <Button
              variant="outline"
              onClick={() => onMessage?.(profile.id)}
            >
              Message
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
