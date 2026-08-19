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
    <div className="fixed inset-0 z-10 flex flex-col bg-black text-white">
      {error && (
        <Alert className="absolute top-2 left-2 right-2 z-50 max-w-md mx-auto border-red-500/50 bg-red-950/90 text-white">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-3 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar className="h-9 w-9 border-2 border-white/20">
            <AvatarImage src={host?.avatar_url || ''} />
            <AvatarFallback>
              {host?.username?.slice(0, 2).toUpperCase() || 'H'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold leading-tight">
              {room.title}
            </h1>
            <p className="truncate text-xs text-gray-300">
              @{host?.username} • {viewerCount} watching
            </p>
          </div>
          <Badge
            variant="secondary"
            className="hidden text-xs sm:inline-flex"
          >
            {room.room_type === 'private' && <Lock className="mr-1 h-3 w-3" />}
            {room.room_type === 'speed_dating'
              ? '⚡ Speed'
              : room.room_type === 'private'
              ? 'Private'
              : 'Public'}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {room.cost_per_minute && isJoined && (
            <div className="hidden items-center gap-1 rounded-full bg-black/40 px-2 py-1 text-xs text-yellow-400 sm:flex">
              <Coins className="h-3 w-3" />
              <span className="font-medium">{totalCost}</span>
            </div>
          )}

          {/* Desktop host controls */}
          <div className="hidden items-center gap-1 md:flex">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleVideo}
              className="h-9 w-9 rounded-full text-white hover:bg-white/20"
            >
              {isVideoEnabled ? (
                <Video className="h-4 w-4" />
              ) : (
                <VideoOff className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleAudio}
              className="h-9 w-9 rounded-full text-white hover:bg-white/20"
            >
              {isAudioEnabled ? (
                <Mic className="h-4 w-4" />
              ) : (
                <MicOff className="h-4 w-4" />
              )}
            </Button>
            {isHost && (
              <Button
                size="sm"
                onClick={handleEndRoom}
                className="rounded-full bg-red-600 text-white hover:bg-red-700"
              >
                End
              </Button>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={isJoined ? handleLeave : onLeave}
            className="rounded-full bg-black/40 text-white hover:bg-white/20"
          >
            Leave
          </Button>
        </div>
      </header>

      {/* Main stage */}
      <main className="relative flex-1 overflow-hidden md:flex">
        {/* Video / join screen */}
        <section className="relative h-full w-full md:flex-1">
          {!isJoined ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-950 p-6">
              <div className="max-w-sm text-center">
                <Monitor className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                <h2 className="mb-2 text-2xl font-bold">{room.title}</h2>
                <p className="mb-5 text-sm text-gray-400">
                  {room.description ||
                    'Join this live room to interact with the host and other viewers'}
                </p>

                {room.cost_per_minute && (
                  <div className="mb-5 rounded-xl bg-yellow-900/30 p-3">
                    <div className="flex items-center justify-center text-yellow-400">
                      <Coins className="mr-2 h-5 w-5" />
                      <span className="font-medium">
                        {room.cost_per_minute} coins per minute
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleJoin}
                  size="lg"
                  className="rounded-full bg-love-red px-10 hover:bg-love-red/90"
                >
                  Join Room
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative h-full w-full">
              <video
                ref={videoRef}
                className="h-full w-full object-cover"
                autoPlay
                playsInline
                muted={!isAudioEnabled}
              />

              {/* Live & viewer pills */}
              <div className="absolute left-3 top-14 z-20 flex items-center gap-2">
                <Badge className="border-0 bg-rose-600 text-xs text-white">
                  <span className="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                  LIVE
                </Badge>
                <Badge className="border-0 bg-black/60 text-xs text-white">
                  <Eye className="mr-1 h-3 w-3" />
                  {viewerCount}
                </Badge>
                {room.cost_per_minute && (
                  <Badge className="border-0 bg-black/60 text-xs text-yellow-400">
                    <Coins className="mr-1 h-3 w-3" />
                    {totalCost}
                  </Badge>
                )}
              </div>

              {/* Floating action buttons */}
              <div className="absolute right-3 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center gap-4">
                <div className="flex flex-col items-center gap-1">
                  <Button
                    onClick={() => setShowGiftShop(true)}
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 rounded-full border border-white/10 bg-white/10 text-white backdrop-blur-md hover:bg-white/20"
                  >
                    <Gift className="h-5 w-5 text-yellow-400" />
                  </Button>
                  <span className="text-[10px] text-white/90">Gift</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-14 w-14 rounded-full bg-love-red text-white shadow-lg shadow-rose-900/40 hover:bg-love-red/90"
                  >
                    <Heart className="h-6 w-6 fill-current" />
                  </Button>
                  <span className="text-[10px] text-white/90">Like</span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Chat side / overlay panel */}
        {isJoined && (
          <aside className="absolute bottom-20 left-0 right-0 z-20 flex h-[32%] flex-col md:static md:h-full md:w-80">
            <div className="flex h-full flex-col border-white/10 bg-gradient-to-t from-black/95 via-black/70 to-transparent md:bg-gray-900 md:border-l md:from-transparent">
              {/* Chat header - desktop */}
              <div className="hidden items-center justify-between border-b border-white/10 p-3 md:flex">
                <div className="flex items-center text-sm font-medium">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Live Chat
                </div>
                <span className="text-xs text-gray-400">
                  {viewerCount} viewers
                </span>
              </div>

              {/* Messages */}
              <div
                ref={messagesContainerRef}
                className="flex-1 space-y-2 overflow-y-auto p-3 pb-2"
              >
                {messages.map(message => (
                  <div key={message.id} className="space-y-1">
                    {message.type === 'system' && (
                      <div className="py-2 text-center text-xs text-gray-400">
                        <Separator className="my-2" />
                        {message.message}
                      </div>
                    )}

                    {message.type === 'gift' && (
                      <div className="py-2 text-center">
                        <div className="inline-flex items-center rounded-full bg-yellow-900/50 px-3 py-1.5 text-xs text-yellow-400">
                          <Gift className="mr-1.5 h-3 w-3" />
                          <span className="font-medium">{message.message}</span>
                        </div>
                      </div>
                    )}

                    {message.type === 'text' && (
                      <div className="flex items-start gap-2">
                        <Avatar className="h-7 w-7 flex-shrink-0">
                          <AvatarImage src={message.avatar_url || ''} />
                          <AvatarFallback className="text-[10px]">
                            {message.username?.slice(0, 2).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1">
                          <div className="mb-0.5 flex items-center gap-2">
                            <span className="text-xs font-medium text-white">
                              {message.username}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {formatTime(message.timestamp)}
                            </span>
                          </div>
                          <p className="break-words text-sm text-white/90">
                            {message.message}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Desktop message input */}
              <div className="hidden border-t border-white/10 p-3 md:block">
                <div className="flex items-center gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 border-gray-700 bg-gray-800 text-white placeholder:text-gray-400"
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
                    size="icon"
                    className="bg-love-red hover:bg-love-red/90"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Mobile bottom sheet */}
        {isJoined && (
          <div className="absolute bottom-0 left-0 right-0 z-30 md:hidden">
            <div className="flex items-center gap-2 bg-gradient-to-t from-black via-black/90 to-transparent p-3">
              {isHost ? (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleVideo}
                    className="h-11 w-11 flex-1 rounded-2xl text-white hover:bg-white/10"
                  >
                    {isVideoEnabled ? (
                      <Video className="h-5 w-5" />
                    ) : (
                      <VideoOff className="h-5 w-5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleAudio}
                    className="h-11 w-11 flex-1 rounded-2xl text-white hover:bg-white/10"
                  >
                    {isAudioEnabled ? (
                      <Mic className="h-5 w-5" />
                    ) : (
                      <MicOff className="h-5 w-5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 flex-1 rounded-2xl text-white hover:bg-white/10"
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleEndRoom}
                    className="flex-1 rounded-2xl bg-red-600 text-white hover:bg-red-700"
                  >
                    End
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleLeave}
                    className="flex-1 rounded-2xl bg-white/10 text-white hover:bg-white/20"
                  >
                    Leave
                  </Button>
                </>
              ) : (
                <>
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Say something..."
                    className="flex-1 rounded-full border-white/10 bg-white/10 text-white placeholder:text-white/60"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                  />
                  <Button
                    onClick={() => setShowGiftShop(true)}
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 rounded-full bg-white/10 text-yellow-400 hover:bg-white/20"
                  >
                    <Gift className="h-5 w-5" />
                  </Button>
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    size="icon"
                    className="h-11 w-11 rounded-full bg-love-red hover:bg-love-red/90"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Gift Shop Modal */}
      {showGiftShop && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 md:items-center md:p-4">
          <div className="h-[85vh] w-full overflow-hidden rounded-t-2xl bg-white md:h-[90vh] md:max-w-4xl md:rounded-2xl">
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
