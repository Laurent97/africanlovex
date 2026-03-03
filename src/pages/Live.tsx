import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { DraggableWrapper } from '@/components/ui/DraggableWrapper';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Gift, 
  Heart, 
  Users, 
  Eye, 
  Share2, 
  MoreVertical,
  Sparkles,
  Crown,
  Star,
  Music,
  Gamepad2,
  Coffee,
  Book,
  Camera,
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  MessageCircle,
  Send,
  Maximize2,
  Minimize2,
  Settings,
  Download,
  ThumbsUp,
  Award,
  Flame,
  Gem,
  Zap,
  Globe,
  MapPin,
  Calendar,
  Clock,
  AlertCircle,
  Shield,
  ChevronDown,
  ChevronUp,
  Move,
  Pin,
  PinOff,
  Loader2,
  Wifi,
  WifiOff,
  User,
  Users2,
  MessageSquare,
  ThumbsUp as ThumbsUpIcon,
  Gift as GiftIcon,
  Menu,
  Home,
  Compass,
  Wallet,
  Bell,
  Settings as SettingsIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

// Types
interface LiveStream {
  id: string;
  host_id: string;
  host_name: string;
  host_avatar: string;
  host_username: string;
  title: string;
  category: string;
  thumbnail_url: string;
  viewer_count: number;
  is_active: boolean;
  started_at: Date;
  host_vip_tier: string;
  host_verified: boolean;
  tags: string[];
  country?: string;
  city?: string;
  age?: number;
  bio?: string;
  room_type: 'public' | 'private' | 'speed_dating';
  max_viewers: number;
  cost_per_minute?: number;
}

interface LiveComment {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  user_vip_tier?: string;
  message: string;
  created_at: Date;
  is_gift?: boolean;
  gift_name?: string;
  gift_icon?: string;
  gift_value?: number;
  is_highlighted?: boolean;
  is_system?: boolean;
}

interface RoomParticipant {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  user_vip_tier?: string;
  joined_at: Date;
  is_host: boolean;
  is_muted: boolean;
  is_video_enabled: boolean;
}

interface Gift {
  id: string;
  name: string;
  name_local: string;
  description: string;
  tier: 'everyday' | 'romantic' | 'serious' | 'legendary' | 'real_world';
  cost_coins: number;
  icon_url: string;
  animation_url?: string;
  is_active: boolean;
}

interface ChatSettings {
  isMinimized: boolean;
  isPinned: boolean;
  width: number;
  height: number;
  position: { x: number; y: number };
  fontSize: 'sm' | 'base' | 'lg';
  showTimestamps: boolean;
  showAvatars: boolean;
}

// Live Thumbnail Component
const LiveThumbnail: React.FC<{ streamId: string; isActive: boolean; className?: string }> = ({ streamId, isActive, className }) => {
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const captureFrame = useCallback(() => {
    if (videoRef.current && canvasRef.current && !videoRef.current.paused && !videoRef.current.ended) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        canvas.width = 400;
        canvas.height = 300;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setThumbnailUrl(dataUrl);
      }
    }
  }, []);

  useEffect(() => {
    if (!isActive) {
      // Set placeholder for inactive streams
      setThumbnailUrl('https://images.unsplash.com/photo-1471471886143-281d93bce7e?w=400&h=300&fit=crop');
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
        captureIntervalRef.current = null;
      }
      return;
    }

    // Try to find the video element for this stream
    const findVideoElement = () => {
      const videoElements = document.querySelectorAll('video');
      for (const video of videoElements) {
        if (video.srcObject && (video.srcObject as MediaStream).active) {
          return video;
        }
      }
      return null;
    };

    const video = findVideoElement();
    if (video) {
      videoRef.current = video;
      
      // Capture initial frame
      captureFrame();
      
      // Set up interval to capture frames every 2 seconds
      captureIntervalRef.current = setInterval(captureFrame, 2000);
    } else {
      // Fallback to placeholder if no video found
      setThumbnailUrl(`https://picsum.photos/seed/${streamId}/400/300`);
    }

    return () => {
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
        captureIntervalRef.current = null;
      }
    };
  }, [isActive, streamId, captureFrame]);

  return (
    <>
      <div className="relative w-full h-full">
        <img
          src={thumbnailUrl}
          alt="Live stream thumbnail"
          className={`w-full h-full object-cover ${className}`}
        />
        {isActive && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-red-600 text-white text-xs font-medium shadow-lg">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            LIVE
          </div>
        )}
      </div>
      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </>
  );
};

// Participant Avatar Component
const ParticipantAvatar: React.FC<{ participant: RoomParticipant; size?: 'sm' | 'md' | 'lg' }> = ({ participant, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  return (
    <div className="relative group">
      <Avatar className={`${sizeClasses[size]} ring-2 ring-white/20 group-hover:ring-rose-500 transition-all`}>
        <AvatarImage src={participant.user_avatar} />
        <AvatarFallback className="bg-gradient-to-r from-rose-500 to-purple-500 text-white">
          {participant.user_name[0]}
        </AvatarFallback>
      </Avatar>
      {participant.user_vip_tier && participant.user_vip_tier !== 'free' && (
        <div className="absolute -top-1 -right-1">
          <Badge className="w-4 h-4 p-0 bg-amber-500 border-2 border-white">
            <Crown className="w-2 h-2 text-white" />
          </Badge>
        </div>
      )}
      {participant.is_host && (
        <div className="absolute -bottom-1 -left-1">
          <Badge className="w-4 h-4 p-0 bg-rose-500 border-2 border-white">
            <Star className="w-2 h-2 text-white" />
          </Badge>
        </div>
      )}
    </div>
  );
};

// Gift Inventory Component
const GiftInventory: React.FC<{ onSendGift: (gift: Gift) => void; onClose: () => void }> = ({ onSendGift, onClose }) => {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGifts();
  }, []);

  const loadGifts = async () => {
    try {
      const { data, error } = await supabase
        .from('gifts')
        .select('*')
        .eq('is_active', true)
        .order('cost_coins', { ascending: true });

      if (error) throw error;
      setGifts(data || []);
    } catch (error) {
      console.error('Error loading gifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const tiers = [
    { id: 'all', label: 'All Gifts', icon: '🎁' },
    { id: 'everyday', label: 'Everyday', icon: '💝' },
    { id: 'romantic', label: 'Romantic', icon: '🌹' },
    { id: 'serious', label: 'Serious', icon: '💍' },
    { id: 'legendary', label: 'Legendary', icon: '👑' },
    { id: 'real_world', label: 'Real World', icon: '🌍' }
  ];

  const filteredGifts = selectedTier === 'all' 
    ? gifts 
    : gifts.filter(g => g.tier === selectedTier);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'everyday': return 'from-blue-500 to-cyan-500';
      case 'romantic': return 'from-rose-500 to-pink-500';
      case 'serious': return 'from-purple-500 to-indigo-500';
      case 'legendary': return 'from-amber-500 to-yellow-500';
      case 'real_world': return 'from-emerald-500 to-green-500';
      default: return 'from-gray-500 to-slate-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-gradient-to-b from-gray-900 to-gray-950 rounded-2xl shadow-2xl overflow-hidden border border-white/10 w-full h-[85vh] sm:h-[80vh] max-w-2xl mx-4 sm:mx-auto"
    >
      <div className="p-3 sm:p-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-rose-600 to-purple-600">
        <h3 className="text-white font-semibold flex items-center gap-2 text-base sm:text-lg">
          <Gift className="w-4 h-4 sm:w-5 sm:h-5" />
          Gift Inventory
        </h3>
        <Button onClick={onClose} variant="ghost" size="sm" className="text-white hover:bg-white/20 p-2 sm:p-1">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-3 sm:p-4 flex flex-col h-full">
        {/* Tier Filters */}
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-3 sm:pb-4 mb-3 sm:mb-4 scrollbar-hide">
          {tiers.map((tier) => (
            <button
              key={tier.id}
              onClick={() => setSelectedTier(tier.id)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm whitespace-nowrap transition-all min-w-fit ${
                selectedTier === tier.id
                  ? `bg-gradient-to-r ${getTierColor(tier.id)} text-white shadow-lg`
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              <span className="text-sm sm:text-base">{tier.icon}</span>
              <span className="hidden xs:inline sm:inline">{tier.label}</span>
            </button>
          ))}
        </div>

        {/* Gifts Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 overflow-y-auto flex-1 p-1 sm:p-2">
            {filteredGifts.map((gift) => (
              <motion.button
                key={gift.id}
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSendGift(gift)}
                className="bg-gradient-to-b from-white/10 to-white/5 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 hover:shadow-xl transition-all group min-h-[100px] sm:min-h-[120px] flex flex-col items-center justify-center"
              >
                <div className="relative mb-1 sm:mb-2">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 mx-auto rounded-full bg-gradient-to-br ${getTierColor(gift.tier)} flex items-center justify-center text-xl sm:text-2xl md:text-3xl group-hover:scale-110 transition-transform`}>
                    {gift.icon_url || '🎁'}
                  </div>
                  {gift.tier === 'legendary' && (
                    <Sparkles className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 animate-pulse" />
                  )}
                </div>
                <h4 className="text-white font-medium text-xs sm:text-sm mb-1 text-center line-clamp-1">{gift.name}</h4>
                <p className="text-rose-400 font-bold text-xs sm:text-sm">{gift.cost_coins} LX</p>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Main Component
const Live = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const streamId = searchParams.get('stream');
  
  // State
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [comments, setComments] = useState<LiveComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [viewerCount, setViewerCount] = useState(0);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [showGoLive, setShowGoLive] = useState(false);
  const [streamTitle, setStreamTitle] = useState('');
  const [streamCategory, setStreamCategory] = useState('entertainment');
  const [streamType, setStreamType] = useState<'public' | 'private' | 'speed_dating'>('public');
  const [maxViewers, setMaxViewers] = useState(100);
  const [costPerMinute, setCostPerMinute] = useState(0);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showGiftMenu, setShowGiftMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(true);
  const [chatSettings, setChatSettings] = useState<ChatSettings>({
    isMinimized: false,
    isPinned: true,
    width: 320,
    height: 500,
    position: { x: window.innerWidth - 340, y: 100 },
    fontSize: 'base',
    showTimestamps: true,
    showAvatars: true
  });
  const [isDragging, setIsDragging] = useState(false);
  const [showEmotes, setShowEmotes] = useState(false);
  const [replyToComment, setReplyToComment] = useState<LiveComment | null>(null);
  const [newStreamNotification, setNewStreamNotification] = useState<LiveStream | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [streamDuration, setStreamDuration] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [gifts, setGifts] = useState<Gift[]>([]);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout>();

  const categories = [
    { value: 'all', label: 'All', icon: <Globe className="w-4 h-4" /> },
    { value: 'entertainment', label: 'Entertainment', icon: <Music className="w-4 h-4" /> },
    { value: 'advice', label: 'Advice', icon: <Book className="w-4 h-4" /> },
    { value: 'lifestyle', label: 'Lifestyle', icon: <Coffee className="w-4 h-4" /> },
    { value: 'gaming', label: 'Gaming', icon: <Gamepad2 className="w-4 h-4" /> },
    { value: 'creative', label: 'Creative', icon: <Camera className="w-4 h-4" /> },
    { value: 'health', label: 'Health', icon: <Heart className="w-4 h-4" /> }
  ];

  const emotes = [
    { emote: '❤️', name: 'heart' },
    { emote: '😊', name: 'smile' },
    { emote: '🔥', name: 'fire' },
    { emote: '🎉', name: 'party' },
    { emote: '👏', name: 'clap' },
    { emote: '👍', name: 'like' },
    { emote: '😍', name: 'love' },
    { emote: '😂', name: 'laugh' },
    { emote: '😢', name: 'sad' },
    { emote: '😮', name: 'wow' },
    { emote: '🙏', name: 'pray' },
    { emote: '💀', name: 'skull' }
  ];

  // Load gifts on mount
  useEffect(() => {
    loadGifts();
  }, []);

  const loadGifts = async () => {
    try {
      const { data, error } = await supabase
        .from('gifts')
        .select('*')
        .eq('is_active', true)
        .order('cost_coins', { ascending: true });

      if (error) throw error;
      setGifts(data || []);
    } catch (error) {
      console.error('Error loading gifts:', error);
    }
  };

  // Load live streams on mount
  useEffect(() => {
    loadLiveStreams();

    const roomsSubscription = supabase
      .channel('live-rooms-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_rooms' }, handleRoomChange)
      .subscribe();

    const participantsSubscription = supabase
      .channel('room-participants-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_participants' }, handleParticipantChange)
      .subscribe();

    return () => {
      roomsSubscription.unsubscribe();
      participantsSubscription.unsubscribe();
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
      if (localStream) localStream.getTracks().forEach(track => track.stop());
    };
  }, []);

  // Auto-join stream from URL
  useEffect(() => {
    if (streamId && liveStreams.length > 0) {
      const stream = liveStreams.find(s => s.id === streamId);
      if (stream) handleJoinStream(stream);
    }
  }, [streamId, liveStreams]);

  // Subscribe to comments when stream is selected
  useEffect(() => {
    if (selectedStream) {
      loadStreamComments(selectedStream.id);
      loadRoomParticipants(selectedStream.id);

      const commentsSubscription = supabase
        .channel(`stream-${selectedStream.id}-comments`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${selectedStream.id}` }, handleNewComment)
        .subscribe();

      const interval = setInterval(() => updateViewerCount(selectedStream.id), 10000);

      durationIntervalRef.current = setInterval(() => {
        if (selectedStream.started_at) {
          const duration = Math.floor((Date.now() - new Date(selectedStream.started_at).getTime()) / 1000);
          setStreamDuration(duration);
        }
      }, 1000);

      return () => {
        commentsSubscription.unsubscribe();
        clearInterval(interval);
        if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
      };
    }
  }, [selectedStream]);

  // Connect video stream
  useEffect(() => {
    if (videoRef && localStream) videoRef.srcObject = localStream;
  }, [videoRef, localStream]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (commentsEndRef.current && !chatSettings.isMinimized) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments, chatSettings.isMinimized]);

  // Add welcome message
  useEffect(() => {
    if (selectedStream && !isHost) {
      addSystemMessage(`👋 Welcome to ${selectedStream.host_name}'s stream!`);
    }
  }, [selectedStream, isHost]);

  const loadLiveStreams = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('live_rooms')
        .select(`
          *,
          host:host_id (
            username,
            full_name,
            avatar_url,
            is_verified,
            vip_tier,
            city,
            country,
            age,
            bio
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const streams: LiveStream[] = (data || []).map(room => ({
        id: room.id,
        host_id: room.host_id,
        host_name: room.host?.full_name || room.host?.username || 'Anonymous',
        host_username: room.host?.username || '',
        host_avatar: room.host?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(room.host?.username || 'User')}&background=B11D2D&color=fff`,
        title: room.title,
        category: room.category || 'entertainment',
        thumbnail_url: room.thumbnail_url || 'https://images.unsplash.com/photo-1471471886143-281d93bce7e?w=400&h=300&fit=crop',
        viewer_count: room.viewer_count || 0,
        is_active: room.is_active,
        started_at: room.created_at,
        host_vip_tier: room.host?.vip_tier || 'free',
        host_verified: room.host?.is_verified || false,
        tags: room.tags || [],
        country: room.host?.country,
        city: room.host?.city,
        age: room.host?.age,
        bio: room.host?.bio,
        room_type: room.room_type,
        max_viewers: room.max_viewers,
        cost_per_minute: room.cost_per_minute
      }));

      setLiveStreams(streams);
    } catch (error) {
      console.error('Error loading live streams:', error);
      toast({ title: 'Error', description: 'Failed to load live streams', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadStreamComments = async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          sender_id,
          content,
          message_type,
          created_at,
          sender:sender_id (
            username,
            full_name,
            avatar_url,
            vip_tier
          )
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) {
        setComments([]);
        return;
      }

      const loadedComments: LiveComment[] = (data || []).map((msg: any) => ({
        id: msg.id,
        user_id: msg.sender_id,
        user_name: msg.sender?.full_name || msg.sender?.username || 'Anonymous',
        user_avatar: msg.sender?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.sender?.username || 'User')}&background=B11D2D&color=fff`,
        user_vip_tier: msg.sender?.vip_tier,
        message: msg.content,
        created_at: msg.created_at,
        is_gift: msg.message_type === 'gift'
      }));

      setComments(loadedComments);
    } catch (error) {
      setComments([]);
    }
  };

  const loadRoomParticipants = async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('room_participants')
        .select(`
          id,
          user_id,
          joined_at,
          is_host,
          is_muted,
          is_video_enabled,
          user:user_id (
            username,
            full_name,
            avatar_url,
            vip_tier
          )
        `)
        .eq('room_id', roomId);

      if (error) {
        setParticipants([]);
        setViewerCount(0);
        return;
      }

      const loadedParticipants: RoomParticipant[] = (data || []).map((p: any) => ({
        id: p.id,
        user_id: p.user_id,
        user_name: p.user?.full_name || p.user?.username || 'Anonymous',
        user_avatar: p.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.user?.username || 'User')}&background=B11D2D&color=fff`,
        user_vip_tier: p.user?.vip_tier,
        joined_at: p.joined_at,
        is_host: p.is_host,
        is_muted: p.is_muted,
        is_video_enabled: p.is_video_enabled
      }));

      setParticipants(loadedParticipants);
      setViewerCount(loadedParticipants.length);
    } catch (error) {
      setParticipants([]);
      setViewerCount(0);
    }
  };

  const updateViewerCount = async (roomId: string) => {
    try {
      const { count } = await supabase
        .from('room_participants')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', roomId);

      setViewerCount(count || 0);
      await supabase.from('live_rooms').update({ viewer_count: count }).eq('id', roomId);
    } catch (error) {
      console.error('Error updating viewer count:', error);
    }
  };

  const handleRoomChange = (payload: any) => {
    if (payload.eventType === 'INSERT' && payload.new.room_type === 'public') {
      supabase
        .from('profiles')
        .select('username, full_name, avatar_url')
        .eq('id', payload.new.host_id)
        .single()
        .then(({ data: host }) => {
          const newStream: LiveStream = {
            id: payload.new.id,
            host_id: payload.new.host_id,
            host_name: host?.full_name || host?.username || 'Anonymous',
            host_username: host?.username || '',
            host_avatar: host?.avatar_url || '',
            title: payload.new.title,
            category: payload.new.category || 'entertainment',
            thumbnail_url: payload.new.thumbnail_url,
            viewer_count: 0,
            is_active: true,
            started_at: payload.new.created_at,
            host_vip_tier: 'free',
            host_verified: false,
            tags: payload.new.tags || [],
            room_type: payload.new.room_type,
            max_viewers: payload.new.max_viewers,
            cost_per_minute: payload.new.cost_per_minute
          };
          setNewStreamNotification(newStream);
          setTimeout(() => setNewStreamNotification(null), 5000);
        });
    } else if (payload.eventType === 'UPDATE' && !payload.new.is_active && payload.old.is_active) {
      if (selectedStream?.id === payload.new.id) {
        addSystemMessage('🔴 The stream has ended.');
        setTimeout(() => setSelectedStream(null), 3000);
      }
    } else if (payload.eventType === 'DELETE' && selectedStream?.id === payload.old.id) {
      setSelectedStream(null);
    }
  };

  const handleParticipantChange = (payload: any) => {
    if (selectedStream && payload.new?.room_id === selectedStream.id) {
      loadRoomParticipants(selectedStream.id);
    }
  };

  const handleNewComment = async (message: any) => {
    const { data: sender } = await supabase
      .from('profiles')
      .select('username, full_name, avatar_url, vip_tier')
      .eq('id', message.sender_id)
      .single();

    const newComment: LiveComment = {
      id: message.id,
      user_id: message.sender_id,
      user_name: sender?.full_name || sender?.username || 'Anonymous',
      user_avatar: sender?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(sender?.username || 'User')}&background=B11D2D&color=fff`,
      user_vip_tier: sender?.vip_tier,
      message: message.content,
      created_at: message.created_at,
      is_gift: message.message_type === 'gift'
    };

    setComments(prev => [...prev, newComment]);
  };

  const addSystemMessage = (message: string) => {
    const systemComment: LiveComment = {
      id: Date.now().toString(),
      user_id: 'system',
      user_name: 'System',
      user_avatar: 'https://ui-avatars.com/api/?name=System&background=5E2A6B&color=fff',
      message: message,
      created_at: new Date(),
      is_system: true
    };
    setComments(prev => [...prev, systemComment]);
  };

  const handleStartLive = async () => {
    if (!user) return;

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch (mediaError) {
        console.error('Media access error:', mediaError);
        
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          toast({ title: "Video-Only Stream", description: "Microphone access denied, streaming with video only." });
          setIsMuted(true);
        } catch {
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
            toast({ title: "Audio-Only Stream", description: "Camera access denied, streaming with audio only." });
            setIsVideoOff(true);
          } catch {
            toast({ 
              title: "Camera/Microphone Permission Denied", 
              description: "Please allow camera and microphone access in your browser settings.",
              variant: "destructive" 
            });
            return;
          }
        }
      }
      
      setLocalStream(stream);
      
      const videoTracks = stream.getVideoTracks();
      const audioTracks = stream.getAudioTracks();
      setIsVideoOff(videoTracks.length === 0);
      setIsMuted(audioTracks.length === 0);

      const { data: room, error } = await supabase
        .from('live_rooms')
        .insert({
          host_id: user.id,
          title: streamTitle || `${user.email?.split('@')[0]}'s Stream`,
          description: `Live stream by ${user.email?.split('@')[0]}`,
          room_type: streamType,
          max_viewers: maxViewers,
          cost_per_minute: streamType === 'private' ? costPerMinute : null,
          is_active: true,
          viewer_count: 1
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from('room_participants').insert({
        room_id: room.id,
        user_id: user.id,
        is_host: true,
        is_muted: audioTracks.length === 0,
        is_video_enabled: videoTracks.length > 0
      });

      await supabase.from('messages').insert({
        room_id: room.id,
        sender_id: user.id,
        content: '🎉 Welcome to my stream!',
        message_type: 'text'
      });

      const newStream: LiveStream = {
        id: room.id,
        host_id: user.id,
        host_name: user.email?.split('@')[0] || 'Anonymous',
        host_username: user.email?.split('@')[0] || '',
        host_avatar: user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email?.split('@')[0] || 'User')}&background=B11D2D&color=fff`,
        title: streamTitle || `${user.email?.split('@')[0]}'s Stream`,
        category: streamCategory,
        thumbnail_url: 'https://images.unsplash.com/photo-1471471886143-281d93bce7e?w=400&h=300&fit=crop',
        viewer_count: 1,
        is_active: true,
        started_at: new Date(),
        host_vip_tier: user.vip_tier || 'free',
        host_verified: user.is_verified || false,
        tags: ['live', streamCategory],
        room_type: streamType,
        max_viewers: maxViewers,
        cost_per_minute: streamType === 'private' ? costPerMinute : undefined
      };

      setIsLive(true);
      setIsHost(true);
      setShowGoLive(false);
      setSelectedStream(newStream);
      
      toast({ title: 'Stream Started!', description: 'You are now live.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to start stream.', variant: 'destructive' });
    }
  };

  const handleStopLive = async () => {
    if (!selectedStream) return;

    try {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
      }

      await supabase.from('live_rooms').update({ is_active: false }).eq('id', selectedStream.id);
      await supabase.from('room_participants').delete().eq('room_id', selectedStream.id);

      setIsLive(false);
      setIsHost(false);
      setIsVideoOff(true);
      setIsMuted(true);
      setSelectedStream(null);
      setComments([]);
      setParticipants([]);

      toast({ title: 'Stream Ended', description: 'Your stream has ended.' });
    } catch (error) {
      console.error('Error ending stream:', error);
    }
  };

  const handleJoinStream = async (stream: LiveStream) => {
    if (!user) return;

    try {
      if (stream.viewer_count >= stream.max_viewers) {
        toast({ title: 'Room Full', description: 'This stream is at maximum capacity.', variant: 'destructive' });
        return;
      }

      if (stream.room_type === 'private' && stream.cost_per_minute) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('coins_balance')
          .eq('id', user.id)
          .single();

        if (!profile || profile.coins_balance < stream.cost_per_minute) {
          toast({ 
            title: 'Insufficient Coins', 
            description: `You need ${stream.cost_per_minute} coins to join this private stream.`,
            variant: 'destructive' 
          });
          return;
        }
      }

      await supabase.from('room_participants').insert({
        room_id: stream.id,
        user_id: user.id,
        is_host: false,
        is_muted: false,
        is_video_enabled: true
      });

      await supabase.from('messages').insert({
        room_id: stream.id,
        sender_id: user.id,
        content: 'Joined the stream! 👋',
        message_type: 'text'
      });

      setSelectedStream(stream);
      toast({ title: 'Joined Stream', description: `You are now watching ${stream.host_name}'s stream.` });
    } catch (error) {
      console.error('Error joining stream:', error);
    }
  };

  const handleLeaveStream = async () => {
    if (!selectedStream || !user) return;

    try {
      await supabase
        .from('room_participants')
        .delete()
        .eq('room_id', selectedStream.id)
        .eq('user_id', user.id);

      setSelectedStream(null);
    } catch (error) {
      console.error('Error leaving stream:', error);
    }
  };

  const handleToggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const handleToggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const handleSendComment = async () => {
    if (!newComment.trim() || !selectedStream || !user) return;

    try {
      await supabase.from('messages').insert({
        room_id: selectedStream.id,
        sender_id: user.id,
        content: newComment,
        message_type: 'text'
      });

      setNewComment('');
      setReplyToComment(null);
    } catch (error) {
      console.error('Error sending comment:', error);
    }
  };

  const handleSendGift = async (gift: Gift) => {
    if (!selectedStream || !user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('coins_balance')
        .eq('id', user.id)
        .single();

      if (!profile || profile.coins_balance < gift.cost_coins) {
        toast({ title: 'Insufficient Coins', description: `You need ${gift.cost_coins} coins.`, variant: 'destructive' });
        return;
      }

      // Deduct coins
      await supabase
        .from('profiles')
        .update({ coins_balance: profile.coins_balance - gift.cost_coins })
        .eq('id', user.id);

      // Add to host (90%)
      const { data: hostProfile } = await supabase
        .from('profiles')
        .select('coins_balance')
        .eq('id', selectedStream.host_id)
        .single();

      if (hostProfile) {
        await supabase
          .from('profiles')
          .update({ coins_balance: hostProfile.coins_balance + Math.floor(gift.cost_coins * 0.9) })
          .eq('id', selectedStream.host_id);
      }

      // Record transactions
      await supabase.from('coin_transactions').insert([
        { user_id: user.id, amount: -gift.cost_coins, type: 'gift_sent', description: `Sent ${gift.name} to ${selectedStream.host_name}` },
        { user_id: selectedStream.host_id, amount: Math.floor(gift.cost_coins * 0.9), type: 'gift_received', description: `Received ${gift.name} from ${user.email?.split('@')[0]}` }
      ]);

      // Send gift message
      await supabase.from('messages').insert({
        room_id: selectedStream.id,
        sender_id: user.id,
        content: `sent a ${gift.name}! ${gift.icon_url}`,
        message_type: 'gift'
      });

      // Show animation
      const giftElement = document.createElement('div');
      giftElement.className = 'fixed inset-0 pointer-events-none flex items-center justify-center z-50';
      giftElement.innerHTML = `<div class="text-9xl animate-bounce">${gift.icon_url || '🎁'}</div>`;
      document.body.appendChild(giftElement);
      setTimeout(() => giftElement.remove(), 2000);

      setShowGiftMenu(false);
      toast({ title: 'Gift Sent!', description: `You sent a ${gift.name} to ${selectedStream.host_name}!` });
    } catch (error) {
      console.error('Error sending gift:', error);
    }
  };

  const handleReply = (comment: LiveComment) => {
    setReplyToComment(comment);
    setNewComment(`@${comment.user_name} `);
  };

  const handleEmoteClick = (emote: string) => {
    setNewComment(prev => prev + ' ' + emote);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const toggleChatMinimize = () => setChatSettings(prev => ({ ...prev, isMinimized: !prev.isMinimized }));
  const toggleChatPin = () => setChatSettings(prev => ({ ...prev, isPinned: !prev.isPinned }));
  const handleDragStart = () => setIsDragging(true);
  const handleDragStop = (data: any) => {
    setIsDragging(false);
    setChatSettings(prev => ({ ...prev, position: { x: data.x, y: data.y } }));
  };

  const handleLike = async () => {
    if (!selectedStream || !user) return;
    await supabase.from('messages').insert({ room_id: selectedStream.id, sender_id: user.id, content: '❤️', message_type: 'text' });
    
    const heartElement = document.createElement('div');
    heartElement.className = 'fixed inset-0 pointer-events-none flex items-center justify-center z-50';
    heartElement.innerHTML = '<div class="text-9xl animate-ping">❤️</div>';
    document.body.appendChild(heartElement);
    setTimeout(() => heartElement.remove(), 1000);
  };

  const handleShare = () => {
    const streamUrl = `${window.location.origin}/live?stream=${selectedStream?.id}`;
    if (navigator.share) {
      navigator.share({ title: `${selectedStream?.host_name}'s Live Stream`, url: streamUrl })
        .catch(() => navigator.clipboard.writeText(streamUrl));
    } else {
      navigator.clipboard.writeText(streamUrl);
      toast({ title: 'Link Copied!', description: 'Stream link copied to clipboard.' });
    }
  };

  const handleThumbsUp = async () => {
    if (!selectedStream || !user) return;
    await supabase.from('messages').insert({ room_id: selectedStream.id, sender_id: user.id, content: '👍 Great stream!', message_type: 'text' });
    
    const thumbsElement = document.createElement('div');
    thumbsElement.className = 'fixed inset-0 pointer-events-none flex items-center justify-center z-50';
    thumbsElement.innerHTML = '<div class="text-9xl animate-bounce">👍</div>';
    document.body.appendChild(thumbsElement);
    setTimeout(() => thumbsElement.remove(), 1000);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return hours > 0 
      ? `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      : `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getCountryFlag = (country: string = '') => {
    const flags: Record<string, string> = {
      'RW': '🇷🇼', 'Rwanda': '🇷🇼',
      'KE': '🇰🇪', 'Kenya': '🇰🇪',
      'UG': '🇺🇬', 'Uganda': '🇺🇬',
      'TZ': '🇹🇿', 'Tanzania': '🇹🇿',
      'BI': '🇧🇮', 'Burundi': '🇧🇮',
      'CD': '🇨🇩', 'Congo': '🇨🇩'
    };
    return flags[country] || '🌍';
  };

  const getRoomTypeIcon = (type: string) => {
    switch (type) {
      case 'public': return <Globe className="w-3 h-3" />;
      case 'private': return <Lock className="w-3 h-3" />;
      case 'speed_dating': return <Zap className="w-3 h-3" />;
      default: return null;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return 'from-slate-300 to-slate-400';
      case 'gold': return 'from-amber-500 to-yellow-500';
      case 'premium': return 'from-purple-500 to-pink-500';
      default: return 'from-gray-500 to-slate-500';
    }
  };

  const filteredStreams = selectedCategory === 'all' 
    ? liveStreams 
    : liveStreams.filter(s => s.category === selectedCategory);

  if (!user) return null;

  // Live Stream Player View
  if (selectedStream) {
    return (
      <AuthGuard>
        <div className="h-screen bg-black relative overflow-hidden">
          {/* Live Stream Player */}
          <div className="absolute inset-0 bg-black">
            {isHost && localStream ? (
              <video
                ref={(el) => setVideoRef(el)}
                autoPlay
                muted={isMuted}
                className="w-full h-full object-contain bg-black"
              />
            ) : (
              <LiveThumbnail
                streamId={selectedStream.id}
                isActive={selectedStream.is_active}
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />

          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button
                  onClick={handleLeaveStream}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 rounded-full"
                >
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </Button>

                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 ring-2 ring-rose-500">
                    <AvatarImage src={selectedStream.host_avatar} />
                    <AvatarFallback>{selectedStream.host_name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block">
                    <div className="flex items-center gap-2">
                      <h2 className="text-white font-semibold">{selectedStream.host_name}</h2>
                      {selectedStream.host_verified && (
                        <Badge className="bg-emerald-600 text-white text-xs">Verified</Badge>
                      )}
                      {selectedStream.host_vip_tier !== 'free' && (
                        <Badge className={`bg-gradient-to-r ${getTierColor(selectedStream.host_vip_tier)} text-black text-xs`}>
                          <Crown className="w-3 h-3 mr-1" />
                          {selectedStream.host_vip_tier}
                        </Badge>
                      )}
                    </div>
                    <p className="text-white/80 text-sm line-clamp-1">{selectedStream.title}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                {/* Mobile Menu */}
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm" className="lg:hidden text-white hover:bg-white/20">
                      <Menu className="w-5 h-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="bg-gray-900 text-white border-gray-800 w-64">
                    <SheetHeader>
                      <SheetTitle className="text-white">Stream Info</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4 space-y-4">
                      <div>
                        <h4 className="text-sm text-gray-400 mb-2">Host</h4>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={selectedStream.host_avatar} />
                            <AvatarFallback>{selectedStream.host_name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{selectedStream.host_name}</p>
                            <p className="text-xs text-gray-400">{selectedStream.city}, {selectedStream.country}</p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm text-gray-400 mb-2">About</h4>
                        <p className="text-sm">{selectedStream.bio || 'No bio yet'}</p>
                      </div>
                      <div>
                        <h4 className="text-sm text-gray-400 mb-2">Tags</h4>
                        <div className="flex flex-wrap gap-1">
                          {selectedStream.tags?.map(tag => (
                            <Badge key={tag} className="bg-white/10 text-white">#{tag}</Badge>
                          ))}
                        </div>
                      </div>
                      <Button
                        onClick={() => setShowParticipants(!showParticipants)}
                        variant="outline"
                        className="w-full border-white/20 text-white hover:bg-white/10"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Viewers ({viewerCount})
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Room Type */}
                <div className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm text-white">
                  {getRoomTypeIcon(selectedStream.room_type)}
                  <span className="text-sm capitalize">{selectedStream.room_type.replace('_', ' ')}</span>
                </div>

                {/* Live Badge */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-600">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <span className="text-white text-sm font-medium hidden sm:inline">LIVE</span>
                </div>

                {/* Viewer Count */}
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm text-white">
                  <Eye className="w-4 h-4" />
                  <span className="text-sm font-medium">{viewerCount}</span>
                </div>

                {/* Duration */}
                <div className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm text-white">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{formatDuration(streamDuration)}</span>
                </div>

                {/* Fullscreen */}
                <Button
                  onClick={toggleFullscreen}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 rounded-full"
                >
                  {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Participants Panel */}
          <AnimatePresence>
            {showParticipants && (
              <motion.div
                initial={{ x: 300 }}
                animate={{ x: 0 }}
                exit={{ x: 300 }}
                className="absolute top-20 right-4 w-64 bg-black/90 backdrop-blur-xl rounded-lg border border-white/10 overflow-hidden z-40"
              >
                <div className="p-3 border-b border-white/10 flex items-center justify-between">
                  <h3 className="text-white font-medium">Viewers ({viewerCount})</h3>
                  <Button onClick={() => setShowParticipants(false)} variant="ghost" size="sm" className="text-white hover:bg-white/20">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="p-2 max-h-96 overflow-y-auto">
                  {participants.map(p => (
                    <div key={p.id} className="flex items-center gap-2 p-2 hover:bg-white/5 rounded-lg">
                      <ParticipantAvatar participant={p} size="sm" />
                      <span className="text-white text-sm flex-1">{p.user_name}</span>
                      {p.is_host && <Star className="w-3 h-3 text-amber-500" />}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                {isHost && (
                  <>
                    <Button
                      onClick={handleToggleVideo}
                      variant="ghost"
                      size="sm"
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${
                        isVideoOff ? 'bg-rose-600 text-white' : 'bg-white/20 text-white'
                      } hover:bg-white/30`}
                    >
                      {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                    </Button>
                    <Button
                      onClick={handleToggleAudio}
                      variant="ghost"
                      size="sm"
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${
                        isMuted ? 'bg-rose-600 text-white' : 'bg-white/20 text-white'
                      } hover:bg-white/30`}
                    >
                      {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </Button>
                  </>
                )}

                <Button
                  onClick={() => setShowGiftMenu(true)}
                  variant="ghost"
                  size="sm"
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 text-white hover:bg-white/30 relative"
                >
                  <Gift className="w-5 h-5" />
                </Button>

                <Button
                  onClick={handleLike}
                  variant="ghost"
                  size="sm"
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 text-white hover:bg-white/30"
                >
                  <Heart className="w-5 h-5" />
                </Button>

                <Button
                  onClick={handleShare}
                  variant="ghost"
                  size="sm"
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 text-white hover:bg-white/30"
                >
                  <Share2 className="w-5 h-5" />
                </Button>

                <Button
                  onClick={() => setShowParticipants(!showParticipants)}
                  variant="ghost"
                  size="sm"
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 text-white hover:bg-white/30"
                >
                  <Users className="w-5 h-5" />
                </Button>

                {isHost && (
                  <Button
                    onClick={handleStopLive}
                    className="px-3 py-2 sm:px-4 sm:py-2 rounded-full bg-rose-600 text-white hover:bg-rose-700 text-sm sm:text-base"
                  >
                    End
                  </Button>
                )}
              </div>

              {/* Chat Toggle */}
              <Button
                onClick={() => setIsChatVisible(!isChatVisible)}
                variant="ghost"
                size="sm"
                className="px-3 py-2 sm:px-4 sm:py-2 rounded-full bg-white/20 text-white hover:bg-white/30 flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Chat</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{comments.length}</span>
              </Button>
            </div>
          </div>

          {/* Movable Chat Window */}
          {isChatVisible && (
            <DraggableWrapper
              handle=".chat-drag-handle"
              position={chatSettings.position}
              onStart={handleDragStart}
              onStop={handleDragStop}
              disabled={chatSettings.isPinned}
            >
              <div
                className={`fixed z-40 transition-shadow ${isDragging ? 'shadow-2xl' : 'shadow-xl'}`}
                style={{ 
                  width: chatSettings.isMinimized ? 240 : Math.min(chatSettings.width, window.innerWidth - 20),
                  height: chatSettings.isMinimized ? 48 : Math.min(chatSettings.height, window.innerHeight - 100),
                  borderRadius: '12px',
                  overflow: 'hidden',
                  backgroundColor: 'rgba(26, 26, 26, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  right: 20,
                  bottom: 20
                }}
              >
                {/* Chat Header */}
                <div 
                  className={`chat-drag-handle flex items-center justify-between px-3 py-2 border-b border-white/10 cursor-move ${isDragging ? 'bg-purple-900/50' : 'hover:bg-white/5'}`}
                >
                  <div className="flex items-center gap-2">
                    <Move className="w-4 h-4 text-white/60" />
                    <h3 className="text-white font-medium text-sm">Live Chat</h3>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-white/60 text-xs">{viewerCount}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button onClick={toggleChatPin} variant="ghost" size="sm" className="h-6 w-6 text-white/60 hover:text-white">
                      {chatSettings.isPinned ? <Pin className="w-3 h-3" /> : <PinOff className="w-3 h-3" />}
                    </Button>
                    <Button onClick={() => setShowSettings(!showSettings)} variant="ghost" size="sm" className="h-6 w-6 text-white/60 hover:text-white">
                      <Settings className="w-3 h-3" />
                    </Button>
                    <Button onClick={toggleChatMinimize} variant="ghost" size="sm" className="h-6 w-6 text-white/60 hover:text-white">
                      {chatSettings.isMinimized ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </Button>
                  </div>
                </div>

                {/* Chat Settings */}
                {showSettings && (
                  <div className="p-3 border-b border-white/10 bg-black/50">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/80">Font Size</span>
                        <div className="flex gap-1">
                          {(['sm', 'base', 'lg'] as const).map((size) => (
                            <Button
                              key={size}
                              onClick={() => setChatSettings(prev => ({ ...prev, fontSize: size }))}
                              variant="ghost"
                              size="sm"
                              className={`h-6 px-2 text-xs ${
                                chatSettings.fontSize === size ? 'bg-purple-600 text-white' : 'text-white/60 hover:text-white'
                              }`}
                            >
                              {size.toUpperCase()}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/80">Timestamps</span>
                        <input
                          type="checkbox"
                          checked={chatSettings.showTimestamps}
                          onChange={(e) => setChatSettings(prev => ({ ...prev, showTimestamps: e.target.checked }))}
                          className="rounded"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/80">Avatars</span>
                        <input
                          type="checkbox"
                          checked={chatSettings.showAvatars}
                          onChange={(e) => setChatSettings(prev => ({ ...prev, showAvatars: e.target.checked }))}
                          className="rounded"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Chat Messages */}
                {!chatSettings.isMinimized && (
                  <>
                    <div 
                      ref={chatContainerRef}
                      className="flex-1 overflow-y-auto p-3 space-y-3"
                      style={{ height: `calc(100% - 100px)` }}
                    >
                      {comments.map((comment) => (
                        <motion.div
                          key={comment.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex items-start gap-2 group ${comment.is_highlighted ? 'bg-purple-900/30 -mx-3 px-3 py-2 rounded-lg' : ''}`}
                        >
                          {chatSettings.showAvatars && (
                            <Avatar className="w-6 h-6 flex-shrink-0">
                              <AvatarImage src={comment.user_avatar} />
                              <AvatarFallback className="bg-rose-500 text-white text-xs">{comment.user_name[0]}</AvatarFallback>
                            </Avatar>
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-white font-medium text-xs">
                                {comment.user_name}
                              </span>
                              {comment.user_vip_tier && comment.user_vip_tier !== 'free' && (
                                <Crown className="w-3 h-3 text-amber-500" />
                              )}
                              {comment.is_gift && (
                                <Badge className="text-xs bg-amber-500 text-black">Gift</Badge>
                              )}
                              {chatSettings.showTimestamps && (
                                <span className="text-white/40 text-xs">{formatTime(comment.created_at)}</span>
                              )}
                            </div>
                            <p className={`text-sm break-words ${
                              comment.is_system ? 'text-purple-400' : 
                              comment.is_gift ? 'text-amber-400' : 'text-white/90'
                            }`}>
                              {comment.message}
                            </p>
                          </div>

                          <Button
                            onClick={() => handleReply(comment)}
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 h-6 w-6 text-white/40 hover:text-white"
                          >
                            <MessageCircle className="w-3 h-3" />
                          </Button>
                        </motion.div>
                      ))}
                      <div ref={commentsEndRef} />
                    </div>

                    {/* Chat Input */}
                    <div className="p-3 border-t border-white/10">
                      {replyToComment && (
                        <div className="flex items-center justify-between bg-purple-900/30 p-2 rounded-lg mb-2">
                          <span className="text-xs text-white/80">
                            Replying to @{replyToComment.user_name}
                          </span>
                          <Button onClick={() => setReplyToComment(null)} variant="ghost" size="sm" className="h-4 w-4 text-white/40 hover:text-white">
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          onClick={() => setShowEmotes(!showEmotes)}
                          variant="ghost"
                          size="sm"
                          className="px-2 text-white/60 hover:text-white"
                        >
                          😊
                        </Button>
                        <Input
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendComment()}
                          placeholder="Type a message..."
                          className="flex-1 bg-white/10 text-white placeholder-white/40 border-white/10 text-sm"
                        />
                        <Button
                          onClick={handleSendComment}
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Emote Picker */}
                      {showEmotes && (
                        <div className="absolute bottom-20 left-3 bg-gray-900 rounded-lg shadow-xl p-2 border border-white/10">
                          <div className="grid grid-cols-6 gap-1">
                            {emotes.map((emote) => (
                              <button
                                key={emote.name}
                                onClick={() => { handleEmoteClick(emote.emote); setShowEmotes(false); }}
                                className="w-8 h-8 hover:bg-white/10 rounded flex items-center justify-center text-lg"
                              >
                                {emote.emote}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </DraggableWrapper>
          )}

          {/* Host Info Overlay */}
          <div className="absolute left-4 top-24 bg-black/50 backdrop-blur-sm rounded-lg p-3 border border-white/10 max-w-xs hidden lg:block">
            <div className="flex items-start gap-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={selectedStream.host_avatar} />
                <AvatarFallback className="bg-rose-500 text-white">{selectedStream.host_name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-white font-medium mb-1">{selectedStream.host_name}</h3>
                <p className="text-white/60 text-xs mb-2">{selectedStream.bio || 'No bio yet'}</p>
                <div className="flex flex-wrap gap-2">
                  {selectedStream.tags?.map((tag) => (
                    <Badge key={tag} className="text-xs bg-white/10 text-white">#{tag}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Gift Menu Modal */}
          <AnimatePresence>
            {showGiftMenu && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
                onClick={() => setShowGiftMenu(false)}
              >
                <div onClick={(e) => e.stopPropagation()}>
                  <GiftInventory onSendGift={handleSendGift} onClose={() => setShowGiftMenu(false)} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </AuthGuard>
    );
  }

  // Live Streams Grid View
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-rose-950/20">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-rose-200 dark:border-rose-900/30">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => navigate('/dashboard')}
                  variant="ghost"
                  size="sm"
                  className="lg:hidden text-gray-700 dark:text-gray-300"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                  <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
                    Live Streams
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Connect with others in real-time
                  </p>
                </motion.div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setShowGoLive(true)}
                  className="bg-gradient-to-r from-rose-500 to-purple-500 text-white hover:from-rose-600 hover:to-purple-600"
                  size="sm"
                >
                  <Video className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Go Live</span>
                </Button>
                <Link to="/dashboard">
                  <Button variant="outline" size="sm" className="hidden sm:inline-flex border-rose-200 dark:border-rose-800">
                    Dashboard
                  </Button>
                </Link>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm" className="lg:hidden">
                      <Menu className="w-5 h-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="bg-white dark:bg-gray-900">
                    <SheetHeader>
                      <SheetTitle>Menu</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4 space-y-2">
                      <Link to="/matching" className="block">
                        <Button variant="ghost" className="w-full justify-start">Matching</Button>
                      </Link>
                      <Link to="/search" className="block">
                        <Button variant="ghost" className="w-full justify-start">Discover</Button>
                      </Link>
                      <Link to="/gifts" className="block">
                        <Button variant="ghost" className="w-full justify-start">Gifts</Button>
                      </Link>
                      <Link to="/wallet" className="block">
                        <Button variant="ghost" className="w-full justify-start">Wallet</Button>
                      </Link>
                      <Link to="/notifications" className="block">
                        <Button variant="ghost" className="w-full justify-start">Notifications</Button>
                      </Link>
                      <Link to="/settings" className="block">
                        <Button variant="ghost" className="w-full justify-start">Settings</Button>
                      </Link>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          {/* Categories */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide"
          >
            {categories.map((category) => (
              <Button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                variant={selectedCategory === category.value ? 'default' : 'outline'}
                size="sm"
                className={`whitespace-nowrap flex items-center gap-2 rounded-full px-4 ${
                  selectedCategory === category.value
                    ? 'bg-gradient-to-r from-rose-500 to-purple-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                }`}
              >
                {category.icon}
                <span className="hidden sm:inline">{category.label}</span>
              </Button>
            ))}
          </motion.div>

          {/* New Stream Notification */}
          <AnimatePresence>
            {newStreamNotification && (
              <motion.div
                initial={{ opacity: 0, y: -50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -50, scale: 0.9 }}
                className="mb-6"
              >
                <div 
                  className="bg-gradient-to-r from-rose-600 to-purple-600 text-white p-4 rounded-xl shadow-lg cursor-pointer hover:shadow-xl transition-all"
                  onClick={() => handleJoinStream(newStreamNotification)}
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                      <div>
                        <div className="font-semibold">🔴 New Stream Started!</div>
                        <div className="text-sm opacity-90">
                          {newStreamNotification.host_name} is streaming "{newStreamNotification.title}"
                        </div>
                      </div>
                    </div>
                    <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                      Join Now
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Loading live streams...</p>
              </div>
            </div>
          )}

          {/* Live Streams Grid */}
          {!loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredStreams.map((stream, index) => (
                <motion.div
                  key={stream.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                  onClick={() => handleJoinStream(stream)}
                  className="cursor-pointer group"
                >
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden bg-white dark:bg-gray-900">
                    <div className="relative">
                      {/* Thumbnail */}
                      <div className="relative h-40 sm:h-48">
                        <LiveThumbnail
                          streamId={stream.id}
                          isActive={stream.is_active}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        
                        {/* Room Type Badge */}
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-black/50 backdrop-blur-sm text-white border-white/20">
                            {getRoomTypeIcon(stream.room_type)}
                            <span className="ml-1 text-xs hidden sm:inline capitalize">{stream.room_type.replace('_', ' ')}</span>
                          </Badge>
                        </div>

                        {/* Viewer Count */}
                        <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs">
                          <Eye className="w-3 h-3" />
                          <span>{stream.viewer_count}</span>
                        </div>

                        {/* Host Info */}
                        <div className="absolute bottom-2 left-2 flex items-center gap-2">
                          <Avatar className="w-6 h-6 ring-2 ring-white/50">
                            <AvatarImage src={stream.host_avatar} />
                            <AvatarFallback className="bg-rose-500 text-white text-xs">{stream.host_name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="bg-black/50 backdrop-blur-sm rounded px-2 py-1">
                            <p className="text-white text-xs font-medium truncate max-w-16 sm:max-w-20">
                              {stream.host_name}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Stream Info */}
                      <CardContent className="p-3 sm:p-4">
                        <h3 className="font-semibold text-sm sm:text-base mb-1 line-clamp-1 text-gray-900 dark:text-gray-100">
                          {stream.title}
                        </h3>
                        
                        <div className="flex items-center justify-between mb-2">
                          <Badge className="text-xs bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-0">
                            {stream.category}
                          </Badge>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDuration(Math.floor((Date.now() - new Date(stream.started_at).getTime()) / 1000))}
                          </span>
                        </div>

                        {/* Tags */}
                        {stream.tags && stream.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {stream.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Host Badges */}
                        <div className="flex items-center gap-2 mb-2">
                          {stream.host_verified && (
                            <div className="flex items-center gap-1">
                              <Shield className="w-3 h-3 text-emerald-500" />
                              <span className="text-xs text-emerald-600 dark:text-emerald-400">Verified</span>
                            </div>
                          )}
                          {stream.host_vip_tier !== 'free' && (
                            <Badge className={`text-xs bg-gradient-to-r ${getTierColor(stream.host_vip_tier)} text-black`}>
                              <Crown className="w-3 h-3 mr-1" />
                              {stream.host_vip_tier}
                            </Badge>
                          )}
                        </div>

                        {/* Location */}
                        {(stream.city || stream.country) && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-3">
                            <MapPin className="w-3 h-3" />
                            <span>{getCountryFlag(stream.country)} {stream.city || stream.country}</span>
                          </div>
                        )}

                        {/* Join Button */}
                        <Button
                          className="w-full bg-gradient-to-r from-rose-500 to-purple-500 text-white hover:from-rose-600 hover:to-purple-600"
                          size="sm"
                        >
                          Join Stream
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      </CardContent>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredStreams.length === 0 && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-center py-12"
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Video className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
                No live streams
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {selectedCategory === 'all' 
                  ? 'Check back later for live content'
                  : `No live streams in ${selectedCategory} category`}
              </p>
              {selectedCategory !== 'all' && (
                <Button onClick={() => setSelectedCategory('all')} className="mt-4">
                  View All Categories
                </Button>
              )}
            </motion.div>
          )}
        </div>

        {/* Go Live Modal */}
        <AnimatePresence>
          {showGoLive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowGoLive(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-md mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-rose-500 to-purple-500 flex items-center justify-center">
                      <Video className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                      Go Live
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Start your own live stream and connect with the community
                    </p>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Stream Title
                      </label>
                      <Input
                        placeholder="Enter your stream title..."
                        value={streamTitle}
                        onChange={(e) => setStreamTitle(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Category
                      </label>
                      <select 
                        value={streamCategory}
                        onChange={(e) => setStreamCategory(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
                      >
                        <option value="entertainment">Entertainment</option>
                        <option value="advice">Advice</option>
                        <option value="lifestyle">Lifestyle</option>
                        <option value="gaming">Gaming</option>
                        <option value="creative">Creative</option>
                        <option value="health">Health</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Stream Type
                      </label>
                      <select 
                        value={streamType}
                        onChange={(e) => setStreamType(e.target.value as any)}
                        className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
                      >
                        <option value="public">Public (Free)</option>
                        <option value="private">Private (Paid)</option>
                        <option value="speed_dating">Speed Dating</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Max Viewers
                      </label>
                      <Input
                        type="number"
                        min={1}
                        max={1000}
                        value={maxViewers}
                        onChange={(e) => setMaxViewers(parseInt(e.target.value))}
                      />
                    </div>

                    {streamType === 'private' && (
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                          Cost per Minute (Coins)
                        </label>
                        <Input
                          type="number"
                          min={0}
                          value={costPerMinute}
                          onChange={(e) => setCostPerMinute(parseInt(e.target.value))}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={() => setShowGoLive(false)} variant="outline" className="flex-1">
                      Cancel
                    </Button>
                    <Button onClick={handleStartLive} className="flex-1 bg-gradient-to-r from-rose-500 to-purple-500 text-white">
                      <Video className="w-4 h-4 mr-2" />
                      Start Live
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AuthGuard>
  );
};

export default Live;