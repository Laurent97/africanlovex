import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Filter, RefreshCw, Users, MapPin, Heart } from 'lucide-react'
import { SwipeCard } from './SwipeCard'
import { getPotentialMatches, swipeProfile, getDailyRecommendations, MatchFilters } from '@/lib/matching'
import { getCurrentUser } from '@/lib/auth'
import type { Database } from '@/lib/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']

interface MatchingInterfaceProps {
  onMatch?: (matchId: string, profile: Profile) => void
  onMessage?: (profileId: string) => void
}

export const MatchingInterface: React.FC<MatchingInterfaceProps> = ({
  onMatch,
  onMessage
}) => {
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [swiping, setSwiping] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<MatchFilters>({})
  const [stats, setStats] = useState({
    totalSwipes: 0,
    likes: 0,
    passes: 0,
    matches: 0,
    matchRate: 0
  })

  const loadProfiles = useCallback(async () => {
    setLoading(true)
    try {
      const user = await getCurrentUser()
      if (!user) return

      let matches
      if (Object.keys(filters).length === 0) {
        // Get daily recommendations if no filters
        const recommendations = await getDailyRecommendations(user.id)
        matches = recommendations.map(r => r.profile)
      } else {
        // Get filtered matches
        const scoredMatches = await getPotentialMatches(user.id, filters)
        matches = scoredMatches.map(m => m.profile)
      }

      setProfiles(matches)
      setCurrentIndex(0)
      setCurrentProfile(matches[0] || null)
    } catch (error: unknown) {
      console.error('Error loading profiles:', error)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    loadProfiles()
  }, [loadProfiles])

  const handleLike = async (profileId: string) => {
    if (swiping) return
    
    setSwiping(true)
    try {
      const user = await getCurrentUser()
      if (!user) return

      const result = await swipeProfile(user.id, profileId, 'like')
      
      if (result.matched && result.matchId) {
        const matchedProfile = profiles.find(p => p.id === profileId)
        if (matchedProfile) {
          onMatch?.(result.matchId, matchedProfile)
        }
      }

      // Move to next profile
      moveToNext()
    } catch (error: unknown) {
      console.error('Error liking profile:', error)
    } finally {
      setSwiping(false)
    }
  }

  const handlePass = async (profileId: string) => {
    if (swiping) return
    
    setSwiping(true)
    try {
      const user = await getCurrentUser()
      if (!user) return

      await swipeProfile(user.id, profileId, 'pass')
      moveToNext()
    } catch (error: unknown) {
      console.error('Error passing profile:', error)
    } finally {
      setSwiping(false)
    }
  }

  const moveToNext = () => {
    if (currentIndex < profiles.length - 1) {
      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)
      setCurrentProfile(profiles[nextIndex])
    } else {
      // No more profiles
      setCurrentProfile(null)
    }
  }

  const handleFilterChange = (key: keyof MatchFilters, value: string | number | string[] | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const applyFilters = () => {
    setShowFilters(false)
    loadProfiles()
  }

  const clearFilters = () => {
    setFilters({})
    setShowFilters(false)
  }

  const currentProfileDisplay = currentProfile

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Finding amazing people for you...</p>
        </div>
      </div>
    )
  }

  if (!currentProfileDisplay && profiles.length === 0) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No profiles found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your filters or check back later for new matches.
            </p>
            <Button onClick={loadProfiles} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!currentProfileDisplay) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="p-6 text-center">
            <Heart className="w-16 h-16 mx-auto mb-4 text-love-red" />
            <h3 className="text-xl font-semibold mb-2">That's everyone for now!</h3>
            <p className="text-muted-foreground mb-4">
              You've seen all available profiles. Check back tomorrow for new recommendations.
            </p>
            <Button onClick={loadProfiles} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Check for New Profiles
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* Stats Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-lg font-bold text-love-red">{stats.matches}</div>
                <div className="text-xs text-muted-foreground">Matches</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">{stats.matchRate}%</div>
                <div className="text-xs text-muted-foreground">Match Rate</div>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {Object.keys(filters).length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {Object.keys(filters).length}
                </Badge>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold">Filter Preferences</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Age Range</Label>
                <div className="space-y-2">
                  <Slider
                    value={[filters.age_min || 18, filters.age_max || 100]}
                    onValueChange={([min, max]) => {
                      handleFilterChange('age_min', min)
                      handleFilterChange('age_max', max)
                    }}
                    min={18}
                    max={100}
                    step={1}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{filters.age_min || 18}</span>
                    <span>{filters.age_max || 100}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Country</Label>
                <Select 
                  value={filters.country || ''} 
                  onValueChange={(value) => handleFilterChange('country', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any country</SelectItem>
                    <SelectItem value="RW">Rwanda 🇷🇼</SelectItem>
                    <SelectItem value="KE">Kenya 🇰🇪</SelectItem>
                    <SelectItem value="UG">Uganda 🇺🇬</SelectItem>
                    <SelectItem value="TZ">Tanzania 🇹🇿</SelectItem>
                    <SelectItem value="BI">Burundi 🇧🇮</SelectItem>
                    <SelectItem value="CD">Congo 🇨🇩</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Relationship Goal</Label>
                <Select 
                  value={filters.relationship_intention || ''} 
                  onValueChange={(value) => handleFilterChange('relationship_intention', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any goal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any goal</SelectItem>
                    <SelectItem value="looking_for_love">Looking for love</SelectItem>
                    <SelectItem value="serious_only">Serious only</SelectItem>
                    <SelectItem value="friends_first">Friends first</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Verification Level</Label>
                <Select
                  value={filters.verification_level || ''}
                  onValueChange={(value: 'basic' | 'standard' | 'premium' | '') => handleFilterChange('verification_level', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any level</SelectItem>
                    <SelectItem value="standard">Verified</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button onClick={applyFilters} className="flex-1">
                Apply Filters
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Indicator */}
      <div className="flex justify-center space-x-2">
        {profiles.map((_, index) => (
          <div
            key={index}
            className={`h-1 w-8 rounded-full transition-colors ${
              index === currentIndex 
                ? 'bg-love-red' 
                : index < currentIndex 
                  ? 'bg-muted' 
                  : 'bg-muted/30'
            }`}
          />
        ))}
      </div>

      {/* Swipe Card */}
      <SwipeCard
        profile={currentProfileDisplay}
        onLike={handleLike}
        onPass={handlePass}
        showCompatibility={true}
        currentUserId={currentProfileDisplay.id} // This would be the actual current user ID
      />

      {/* Quick Actions */}
      <div className="flex justify-center space-x-4">
        <Button
          variant="outline"
          size="lg"
          className="rounded-full w-16 h-16 p-0 border-red-200 hover:bg-red-50"
          onClick={() => handlePass(currentProfileDisplay.id)}
          disabled={swiping}
        >
          <span className="text-2xl">✕</span>
        </Button>

        <Button
          variant="outline"
          size="lg"
          className="rounded-full w-16 h-16 p-0"
          onClick={() => onMessage?.(currentProfileDisplay.id)}
        >
          <span className="text-2xl">💬</span>
        </Button>

        <Button
          size="lg"
          className="rounded-full w-16 h-16 p-0 bg-love-red hover:bg-love-red/90"
          onClick={() => handleLike(currentProfileDisplay.id)}
          disabled={swiping}
        >
          <span className="text-2xl">❤️</span>
        </Button>
      </div>
    </div>
  )
}
