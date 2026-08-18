import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Users, 
  Gift, 
  Heart, 
  Send,
  Settings,
  Monitor,
  MessageSquare,
  Coins,
  Clock,
  Eye,
  Lock
} from 'lucide-react'
import { 
  joinLiveRoom, 
  leaveLiveRoom, 
  endLiveRoom,
  recordRoomViewTime,
  getRoomDetails 
} from '@/lib/liveStreaming'
import { getCurrentUser } from '@/lib/auth'
import { GiftShop } from '@/components/gifts/GiftShop'
import type { Database } from '@/lib/supabase'

type LiveRoom = Database['public']['Tables']['live_rooms']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

interface LiveRoomInterfaceProps {
  roomId: string
  onLeave?: () => void
}

interface ChatMessage {
  id: string
  user_id: string
  username: string
  avatar_url?: string
  message: string
  timestamp: string
  type: 'text' | 'gift' | 'system'
}

export const LiveRoomInterface: React.FC<LiveRoomInterfaceProps> = ({
  roomId,
  onLeave
}) => {
  const [room, setRoom] = useState<LiveRoom | null>(null)
  const [host, setHost] = useState<Profile | null>(null)
  const [isJoined, setIsJoined] = useState(false)
  const [isHost, setIsHost] = useState(false)
  const [viewerCount, setViewerCount] = useState(0)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [showGiftShop, setShowGiftShop] = useState(false)
  const [viewingStartTime, setViewingStartTime] = useState<Date | null>(null)
  const [totalCost, setTotalCost] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const loadRoom = useCallback(async () => {
    try {
      const user = await getCurrentUser()
      if (!user) {
        setError('You must be logged in to join live rooms')
        return
      }

      const roomDetails = await getRoomDetails(roomId)
      setRoom(roomDetails.room)
      setHost(roomDetails.host)
      setIsHost(roomDetails.host.id === user.id)

      setLoading(false)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to load room')
      setLoading(false)
    }
  }, [roomId])

  const handleLeave = useCallback(async () => {
    try {
      const user = await getCurrentUser()
      if (!user) return

      await leaveLiveRoom(user.id, roomId)
      setIsJoined(false)
      setViewerCount(prev => Math.max(0, prev - 1))

      // Record viewing time for private rooms
      if (room?.cost_per_minute && viewingStartTime) {
        const minutes = Math.ceil((Date.now() - viewingStartTime.getTime()) / 1000 / 60)
        await recordRoomViewTime(user.id, roomId, minutes)
      }

      onLeave?.()
    } catch (error: unknown) {
      console.error('Error leaving room:', error)
    }
  }, [roomId, room, viewingStartTime, onLeave])

  useEffect(() => {
    loadRoom()
    return () => {
      if (isJoined) {
        handleLeave()
      }
    }
  }, [roomId, loadRoom, handleLeave, isJoined])

  useEffect(() => {
    // Auto-scroll to bottom of chat
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  useEffect(() => {
    // Update viewing cost for private rooms
    if (isJoined && room?.cost_per_minute && viewingStartTime) {
      const interval = setInterval(() => {
        const elapsed = (Date.now() - viewingStartTime.getTime()) / 1000 / 60
        setTotalCost(Math.ceil(elapsed * room.cost_per_minute))
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [isJoined, room, viewingStartTime])

  const handleJoin = async () => {
    if (!room) return

    try {
      const user = await getCurrentUser()
      if (!user) return

      const result = await joinLiveRoom(user.id, roomId)
      
      if (result.success) {
        setIsJoined(true)
        setViewingStartTime(new Date())
        setViewerCount(prev => prev + 1)
        
        // Add system message
        const joinMessage: ChatMessage = {
          id: Date.now().toString(),
          user_id: 'system',
          username: 'System',
          message: `${user.email} joined the room`,
          timestamp: new Date().toISOString(),
          type: 'system'
        }
        setMessages(prev => [...prev, joinMessage])
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to join room')
    }
  }


  const handleEndRoom = async () => {
    if (!isHost) return

    try {
      const user = await getCurrentUser()
      if (!user) return

      await endLiveRoom(user.id, roomId)
      onLeave?.()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to end room')
    }
  }

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled)
    // In a real implementation, this would control the actual video stream
  }

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled)
    // In a real implementation, this would control the actual audio stream
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !isJoined) return

    try {
      const user = await getCurrentUser()
      if (!user) return

      // In a real implementation, this would send the message via WebSocket
      const message: ChatMessage = {
        id: Date.now().toString(),
        user_id: user.id,
        username: user.email || 'Anonymous',
        message: newMessage.trim(),
        timestamp: new Date().toISOString(),
        type: 'text'
      }

      setMessages(prev => [...prev, message])
      setNewMessage('')
    } catch (error: unknown) {
      console.error('Error sending message:', error)
    }
  }

  const handleGiftSent = (gift: Record<string, unknown>) => {
    // Add gift message to chat
    const user = getCurrentUser()
    if (!user) return

    const giftMessage: ChatMessage = {
      id: Date.now().toString(),
      user_id: user.id,
      username: user.email || 'Anonymous',
      message: `Sent a ${gift.name} gift!`,
      timestamp: new Date().toISOString(),
      type: 'gift'
    }

    setMessages(prev => [...prev, giftMessage])
    setShowGiftShop(false)
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse">Loading room...</div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-red-500 mb-4">Room not found</div>
            <Button onClick={onLeave}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-black">
      {error && (
        <Alert className="m-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-900 text-white">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src={host?.avatar_url || ''} />
              <AvatarFallback>
                {host?.username?.slice(0, 2).toUpperCase() || 'H'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{room.title}</div>
              <div className="text-sm text-gray-400">
                {host?.username} • {viewerCount} viewers
              </div>
            </div>
          </div>
          
          <Badge variant="secondary">
            {room.room_type === 'private' && <Lock className="w-3 h-3 mr-1" />}
            {room.room_type === 'speed_dating' ? '⚡ Speed Dating' : 
             room.room_type === 'private' ? '🔒 Private Room' : '🌍 Public Room'}
          </Badge>
        </div>

        <div className="flex items-center space-x-2">
          {room.cost_per_minute && isJoined && (
            <div className="flex items-center text-yellow-400">
              <Coins className="w-4 h-4 mr-1" />
              <span className="font-medium">{totalCost} coins</span>
            </div>
          )}
          
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleVideo}
              className="text-white hover:bg-gray-800"
            >
              {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleAudio}
              className="text-white hover:bg-gray-800"
            >
              {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowGiftShop(!showGiftShop)}
              className="text-white hover:bg-gray-800"
            >
              <Gift className="w-4 h-4" />
            </Button>
            
            {isHost && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEndRoom}
                className="text-red-400 hover:bg-gray-800"
              >
                End Room
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={isJoined ? handleLeave : onLeave}
              className="text-white hover:bg-gray-800"
            >
              Leave
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Video Area */}
        <div className="flex-1 relative bg-gray-800">
          {!isJoined ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="mb-4">
                  <Monitor className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold mb-2">{room.title}</h2>
                <p className="text-gray-400 mb-4">
                  {room.description || 'Join this live room to interact with the host and other viewers'}
                </p>
                
                {room.cost_per_minute && (
                  <div className="mb-4 p-3 bg-yellow-900/50 rounded-lg">
                    <div className="flex items-center justify-center text-yellow-400">
                      <Coins className="w-5 h-5 mr-2" />
                      <span className="font-medium">
                        {room.cost_per_minute} coins per minute
                      </span>
                    </div>
                  </div>
                )}
                
                <Button
                  onClick={handleJoin}
                  className="bg-love-red hover:bg-love-red/90"
                  size="lg"
                >
                  Join Room
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full">
              {/* Main video (host or featured participant) */}
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted={!isAudioEnabled}
              />
              
              {/* Overlay info */}
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                <div className="flex items-center space-x-2">
                  <div className="bg-black/70 text-white px-3 py-1 rounded-full flex items-center">
                    <Eye className="w-4 h-4 mr-1" />
                    <span className="font-medium">{viewerCount}</span>
                  </div>
                  
                  <div className="bg-black/70 text-white px-3 py-1 rounded-full flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    <span className="font-medium">
                      {viewingStartTime ? 
                        Math.floor((Date.now() - viewingStartTime.getTime()) / 1000 / 60) + 'm' : 
                        '0m'
                      }
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1">
                  {!isVideoEnabled && (
                    <div className="bg-red-500 text-white px-2 py-1 rounded text-sm">
                      Video Off
                    </div>
                  )}
                  {!isAudioEnabled && (
                    <div className="bg-red-500 text-white px-2 py-1 rounded text-sm">
                      Muted
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat Sidebar */}
        <div className="w-80 bg-gray-900 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-white">
                <MessageSquare className="w-4 h-4 mr-2" />
                <span className="font-medium">Live Chat</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="text-sm text-gray-400">
                  {viewerCount} viewers
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-3"
          >
            {messages.map(message => (
              <div key={message.id} className="space-y-1">
                {message.type === 'system' && (
                  <div className="text-center text-gray-400 text-sm py-2">
                    <Separator className="my-2" />
                    {message.message}
                  </div>
                )}
                
                {message.type === 'gift' && (
                  <div className="text-center py-2">
                    <div className="inline-flex items-center bg-yellow-900/50 text-yellow-400 px-3 py-2 rounded-full">
                      <Gift className="w-4 h-4 mr-2" />
                      <span className="font-medium">{message.message}</span>
                    </div>
                  </div>
                )}
                
                {message.type === 'text' && (
                  <div className="flex items-start space-x-2">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={message.avatar_url || ''} />
                      <AvatarFallback className="text-xs">
                        {message.username?.slice(0, 2).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-white text-sm">
                          {message.username}
                        </span>
                        <span className="text-gray-400 text-xs">
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                      <p className="text-white text-sm break-words">
                        {message.message}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Message Input */}
          {isJoined && (
            <div className="p-4 border-t border-gray-800">
              <div className="flex items-center space-x-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                />
                
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  size="sm"
                  className="bg-love-red hover:bg-love-red/90"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Gift Shop Modal */}
      {showGiftShop && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <GiftShop
              recipientId={host?.id}
              onGiftSent={handleGiftSent}
              onClose={() => setShowGiftShop(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
