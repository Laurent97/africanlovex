import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { X, Heart, Info, MapPin, Calendar } from 'lucide-react'
import type { Database } from '@/lib/supabase'
import { calculateCompatibilityScore } from '@/lib/matching'

type Profile = Database['public']['Tables']['profiles']['Row']

interface SwipeCardProps {
  profile: Profile
  onLike: (profileId: string) => void
  onPass: (profileId: string) => void
  onInfo?: (profileId: string) => void
  showCompatibility?: boolean
  currentUserId?: string
}

export const SwipeCard: React.FC<SwipeCardProps> = ({
  profile,
  onLike,
  onPass,
  onInfo,
  showCompatibility = false,
  currentUserId
}) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const compatibilityScore = currentUserId ? 
    calculateCompatibilityScore(
      { id: currentUserId } as Profile, 
      profile
    ) : null

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
      basic: { color: 'bg-gray-100 text-gray-800', text: 'Basic' },
      standard: { color: 'bg-blue-100 text-blue-800', text: 'Verified' },
      premium: { color: 'bg-purple-100 text-purple-800', text: 'Premium' }
    }
    
    const badge = badges[level as keyof typeof badges] || badges.basic
    return (
      <Badge className={badge.color}>
        {badge.text}
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

  return (
    <Card className="w-full h-full relative overflow-hidden">
      {/* Compatibility Score Overlay */}
      {showCompatibility && compatibilityScore && (
        <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-love-red">
              {compatibilityScore.score}%
            </div>
            <div className="text-xs text-muted-foreground">Match</div>
          </div>
        </div>
      )}

      {/* Profile Image */}
      <div className="relative h-96 bg-muted">
        {profile.avatar_url && !imageError ? (
          <>
            <img
              src={profile.avatar_url}
              alt={profile.username}
              className="w-full h-full object-cover"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-pulse bg-muted h-full w-full" />
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-love-red/20 to-love-purple/20">
            <Avatar className="w-24 h-24">
              <AvatarFallback className="text-2xl">
                {profile.username?.slice(0, 2).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
        )}

        {/* Online indicator */}
        <div className="absolute bottom-4 left-4 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
      </div>

      <CardContent className="p-4">
        {/* User Info */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold">{profile.username}</h3>
            <div className="flex items-center space-x-1">
              {profile.is_verified && getVerificationBadge(profile.verification_level)}
              {profile.vip_tier !== 'free' && (
                <Badge variant="outline" className="text-xs">
                  {profile.vip_tier.toUpperCase()}
                </Badge>
              )}
            </div>
          </div>
          
          <p className="text-lg font-medium text-muted-foreground mb-1">
            {profile.full_name}
          </p>
          
          <div className="flex items-center text-sm text-muted-foreground mb-2">
            <MapPin className="w-4 h-4 mr-1" />
            {getLocationDisplay(profile.city, profile.country)}
          </div>
          
          {profile.age && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 mr-1" />
              {getAgeDisplay(profile.age)}
            </div>
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="mb-3">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {profile.bio}
            </p>
          </div>
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {getRelationshipIntentionBadge(profile.relationship_intention)}
          
          {profile.languages && profile.languages.length > 0 && (
            <Badge variant="outline" className="text-xs">
              Speaks {profile.languages.slice(0, 2).join(', ')}
              {profile.languages.length > 2 && ` +${profile.languages.length - 2}`}
            </Badge>
          )}
          
          {profile.interests && profile.interests.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {profile.interests.slice(0, 2).join(', ')}
              {profile.interests.length > 2 && ` +${profile.interests.length - 2}`}
            </Badge>
          )}
        </div>

        {/* Compatibility Reasons */}
        {showCompatibility && compatibilityScore && compatibilityScore.reasons.length > 0 && (
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Why you match:</h4>
            <ul className="text-xs space-y-1">
              {compatibilityScore.reasons.slice(0, 3).map((reason, index) => (
                <li key={index} className="flex items-center">
                  <div className="w-1 h-1 bg-love-red rounded-full mr-2"></div>
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            size="lg"
            className="rounded-full w-14 h-14 p-0 border-red-200 hover:bg-red-50 hover:border-red-300"
            onClick={() => onPass(profile.id)}
          >
            <X className="w-6 h-6 text-red-500" />
          </Button>

          {onInfo && (
            <Button
              variant="outline"
              size="lg"
              className="rounded-full w-14 h-14 p-0"
              onClick={() => onInfo(profile.id)}
            >
              <Info className="w-6 h-6" />
            </Button>
          )}

          <Button
            size="lg"
            className="rounded-full w-14 h-14 p-0 bg-love-red hover:bg-love-red/90"
            onClick={() => onLike(profile.id)}
          >
            <Heart className="w-6 h-6" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
