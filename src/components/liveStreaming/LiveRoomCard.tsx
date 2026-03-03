import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Users, 
  Eye, 
  Lock, 
  Clock, 
  MapPin, 
  Play, 
  Heart,
  Star,
  Crown
} from 'lucide-react'
import type { Database } from '@/lib/supabase'

type LiveRoom = Database['public']['Tables']['live_rooms']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

interface LiveRoomCardProps {
  room: LiveRoom & {
    host_profile: Profile
  }
  onJoin?: (roomId: string) => void
  onWatch?: (roomId: string) => void
  showHostInfo?: boolean
  compact?: boolean
}

export const LiveRoomCard: React.FC<LiveRoomCardProps> = ({
  room,
  onJoin,
  onWatch,
  showHostInfo = true,
  compact = false
}) => {
  const [imageError, setImageError] = useState(false)

  const getRoomTypeIcon = (type: string) => {
    switch (type) {
      case 'speed_dating':
        return <div className="text-2xl">⚡</div>
      case 'private':
        return <Lock className="w-5 h-5" />
      case 'public':
      default:
        return <Users className="w-5 h-5" />
    }
  }

  const getRoomTypeBadge = (type: string) => {
    switch (type) {
      case 'speed_dating':
        return { text: 'Speed Dating', color: 'bg-yellow-100 text-yellow-800' }
      case 'private':
        return { text: 'Private', color: 'bg-red-100 text-red-800' }
      case 'public':
      default:
        return { text: 'Public', color: 'bg-green-100 text-green-800' }
    }
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

  const formatViewerCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }

  const formatCost = (cost: number | null) => {
    if (!cost) return 'Free'
    return `${cost} coins/min`
  }

  if (compact) {
    return (
      <Card className="w-full hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            {/* Thumbnail */}
            <div className="relative w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
              {room.thumbnail_url && !imageError ? (
                <img
                  src={room.thumbnail_url}
                  alt={room.title}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-love-red/20 to-love-purple/20 flex items-center justify-center">
                  {getRoomTypeIcon(room.room_type)}
                </div>
              )}
              
              {/* Live indicator */}
              <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              
              {/* Viewer count */}
              <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1 rounded flex items-center">
                <Eye className="w-3 h-3 mr-1" />
                {formatViewerCount(room.viewer_count)}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold truncate">{room.title}</h3>
                {room.cost_per_minute && (
                  <Badge variant="outline" className="text-xs">
                    {formatCost(room.cost_per_minute)}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={room.host_profile.avatar_url || ''} />
                    <AvatarFallback className="text-xs">
                      {room.host_profile.username?.slice(0, 2).toUpperCase() || 'H'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground truncate">
                    {room.host_profile.username}
                  </span>
                </div>
                
                <Badge className={getRoomTypeBadge(room.room_type).color}>
                  {getRoomTypeBadge(room.room_type).text}
                </Badge>
              </div>
            </div>

            {/* Join button */}
            <Button
              size="sm"
              onClick={() => onJoin?.(room.id)}
              className="flex-shrink-0"
            >
              <Play className="w-4 h-4 mr-1" />
              Join
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-xl font-bold">{room.title}</h3>
              <Badge className={getRoomTypeBadge(room.room_type).color}>
                {getRoomTypeIcon(room.room_type)}
                <span className="ml-1">{getRoomTypeBadge(room.room_type).text}</span>
              </Badge>
              {room.cost_per_minute && (
                <Badge variant="outline">
                  {formatCost(room.cost_per_minute)}
                </Badge>
              )}
            </div>
            
            {room.description && (
              <p className="text-muted-foreground line-clamp-2 mb-3">
                {room.description}
              </p>
            )}
          </div>

          {/* Live indicator */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center text-red-500">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></div>
              <span className="font-medium">LIVE</span>
            </div>
          </div>
        </div>

        {/* Thumbnail/Preview */}
        <div className="relative mb-4 rounded-lg overflow-hidden bg-muted">
          {room.thumbnail_url && !imageError ? (
            <img
              src={room.thumbnail_url}
              alt={room.title}
              className="w-full h-48 object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-48 bg-gradient-to-br from-love-red/20 to-love-purple/20 flex items-center justify-center">
              <div className="text-center">
                {getRoomTypeIcon(room.room_type)}
                <p className="mt-2 text-muted-foreground">{room.title}</p>
              </div>
            </div>
          )}

          {/* Overlay stats */}
          <div className="absolute bottom-2 left-2 flex items-center space-x-3">
            <div className="bg-black/70 text-white px-2 py-1 rounded flex items-center">
              <Eye className="w-4 h-4 mr-1" />
              <span className="font-medium">{formatViewerCount(room.viewer_count)}</span>
            </div>
            
            <div className="bg-black/70 text-white px-2 py-1 rounded flex items-center">
              <Users className="w-4 h-4 mr-1" />
              <span className="font-medium">/{room.max_viewers}</span>
            </div>
          </div>

          {/* Join button overlay */}
          <div className="absolute top-2 right-2">
            <Button
              size="sm"
              onClick={() => onJoin?.(room.id)}
              className="bg-love-red hover:bg-love-red/90"
            >
              <Play className="w-4 h-4 mr-1" />
              Join Room
            </Button>
          </div>
        </div>

        {/* Host Information */}
        {showHostInfo && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center space-x-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={room.host_profile.avatar_url || ''} />
                <AvatarFallback>
                  {room.host_profile.username?.slice(0, 2).toUpperCase() || 'H'}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{room.host_profile.username}</span>
                  {room.host_profile.is_verified && 
                    getVerificationBadge(room.host_profile.verification_level)
                  }
                </div>
                
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 mr-1" />
                  {room.host_profile.country}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="w-4 h-4 mr-1" />
                Started {new Date(room.created_at).toLocaleTimeString()}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2 mt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onWatch?.(room.id)}
          >
            <Eye className="w-4 h-4 mr-2" />
            Watch Preview
          </Button>
          
          <Button
            className="flex-1 bg-love-red hover:bg-love-red/90"
            onClick={() => onJoin?.(room.id)}
          >
            <Play className="w-4 h-4 mr-2" />
            Join Room
          </Button>
        </div>

        {/* Room Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-lg font-bold text-love-red">
              {formatViewerCount(room.viewer_count)}
            </div>
            <div className="text-xs text-muted-foreground">Viewers</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-love-purple">
              {room.max_viewers}
            </div>
            <div className="text-xs text-muted-foreground">Max Capacity</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-love-gold">
              {formatCost(room.cost_per_minute)}
            </div>
            <div className="text-xs text-muted-foreground">Cost</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
