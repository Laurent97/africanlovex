import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Video, VideoOff, Mic, MicOff, Gift, Heart, Users, Eye, 
  Share2, Sparkles, Crown, Star, Music, Gamepad2, Coffee,
  Book, Camera, X, ChevronLeft, ChevronRight, MessageCircle,
  Send, Maximize2, Minimize2, Settings, ThumbsUp, Flame,
  Zap, Globe, MapPin, Clock, AlertCircle, Shield, ChevronDown,
  ChevronUp, Move, Pin, PinOff, Loader2, User, Menu, Lock,
  Wifi, WifiOff, Volume2, VolumeX, Download, Award, Gem
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { uploadToCloudinary } from '@/lib/cloudinary';

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
  dating_focus?: string;
  min_age_preference?: number;
  max_age_preference?: number;
  gender_preference?: string[];
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
  is_dating_interest?: boolean;
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
  is_interested?: boolean;
  age?: number;
  relationship_intention?: string;
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

// Mobile-First Components

const LiveThumbnail: React.FC<{ stream: LiveStream; className?: string }> = ({ stream, className }) => {
  return (
    <div className="relative w-full h-full">
      <img
        src={stream.thumbnail_url}
        alt={`${stream.host_name}'s live stream`}
        className={cn("w-full h-full object-cover", className)}
        loading="lazy"
        onError={(e) => {
          // Fallback to generated placeholder if thumbnail fails to load
          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(stream.host_name)}&size=400&background=B11D2D&color=fff&format=png`;
        }}
      />
      {stream.is_active && (
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-red-600 text-white text-xs font-medium shadow-lg">
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          LIVE
        </div>
      )}
      <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 text-white text-xs font-medium">
        <Users className="w-3 h-3" />
        {stream.viewer_count}
      </div>
    </div>
  );
};

const ParticipantAvatar: React.FC<{ participant: RoomParticipant; size?: 'sm' | 'md' | 'lg'; onClick?: () => void }> = ({ 
  participant, size = 'md', onClick 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  return (
    <div className="relative group" onClick={onClick}>
      <Avatar className={cn(
        sizeClasses[size],
        "ring-2 ring-white/20 group-hover:ring-rose-500 transition-all cursor-pointer"
      )}>
        <AvatarImage src={participant.user_avatar} />
        <AvatarFallback className="bg-gradient-to-r from-rose-500 to-purple-500 text-white">
          {participant.user_name[0]}
        </AvatarFallback>
      </Avatar>
      
      {participant.user_vip_tier && participant.user_vip_tier !== 'free' && (
        <div className="absolute -top-1 -right-1">
          <Badge className="w-4 h-4 p-0 bg-amber-500 border-2 border-white rounded-full">
            <Crown className="w-2 h-2 text-white" />
          </Badge>
        </div>
      )}
      
      {participant.is_interested && (
        <div className="absolute -bottom-1 -right-1">
          <Badge className="w-4 h-4 p-0 bg-rose-500 border-2 border-white rounded-full">
            <Heart className="w-2 h-2 text-white" />
          </Badge>
        </div>
      )}
      
      {participant.is_host && (
        <div className="absolute -bottom-1 -left-1">
          <Badge className="w-4 h-4 p-0 bg-purple-500 border-2 border-white rounded-full">
            <Star className="w-2 h-2 text-white" />
          </Badge>
        </div>
      )}
    </div>
  );
};

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
    { id: 'all', label: 'All', icon: '🎁' },
    { id: 'everyday', label: 'Everyday', icon: '💝' },
    { id: 'romantic', label: 'Romantic', icon: '🌹' },
    { id: 'serious', label: 'Serious', icon: '💍' },
    { id: 'legendary', label: 'Legendary', icon: '👑' },
    { id: 'real_world', label: 'Real', icon: '🌍' }
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
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="bg-gradient-to-b from-gray-900 to-gray-950 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden border border-white/10 w-full max-w-lg mx-auto"
    >
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-rose-600 to-purple-600 sticky top-0">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Gift className="w-5 h-5" />
          Gift Shop
        </h3>
        <Button onClick={onClose} variant="ghost" size="sm" className="text-white hover:bg-white/20">
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="p-4 max-h-[70vh] overflow-y-auto">
        {/* Tier Filters */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
          {tiers.map((tier) => (
            <button
              key={tier.id}
              onClick={() => setSelectedTier(tier.id)}
              className={cn(
                "flex items-center gap-1 px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all",
                selectedTier === tier.id
                  ? `bg-gradient-to-r ${getTierColor(tier.id)} text-white shadow-lg`
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              )}
            >
              <span>{tier.icon}</span>
              <span className="hidden xs:inline">{tier.label}</span>
            </button>
          ))}
        </div>

        {/* Gifts Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredGifts.map((gift) => (
              <motion.button
                key={gift.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSendGift(gift)}
                className="bg-gradient-to-b from-white/10 to-white/5 rounded-xl p-3 hover:shadow-xl transition-all group"
              >
                <div className="relative mb-2">
                  <div className={cn(
                    "w-12 h-12 mx-auto rounded-full bg-gradient-to-br flex items-center justify-center text-2xl group-hover:scale-110 transition-transform",
                    getTierColor(gift.tier)
                  )}>
                    {gift.icon_url || '🎁'}
                  </div>
                  {gift.tier === 'legendary' && (
                    <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-yellow-500 animate-pulse" />
                  )}
                </div>
                <h4 className="text-white font-medium text-xs text-center mb-1 line-clamp-1">{gift.name}</h4>
                <p className="text-rose-400 font-bold text-xs text-center">{gift.cost_coins} 💎</p>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

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
  const [streamCategory, setStreamCategory] = useState('icebreakers');
  const [streamType, setStreamType] = useState<'public' | 'private' | 'speed_dating'>('public');
  const [maxViewers, setMaxViewers] = useState(100);
  const [costPerMinute, setCostPerMinute] = useState(0);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showGiftMenu, setShowGiftMenu] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showIcebreakers, setShowIcebreakers] = useState(false);
  const [showProfileCard, setShowProfileCard] = useState(false);
  const [speedDatingTimer, setSpeedDatingTimer] = useState(300);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [streamDuration, setStreamDuration] = useState(0);
  const [newStreamNotification, setNewStreamNotification] = useState<LiveStream | null>(null);
  const [replyToComment, setReplyToComment] = useState<LiveComment | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<RoomParticipant | null>(null);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout>();

  const categories = [
    { value: 'all', label: 'All', icon: <Globe className="w-4 h-4" /> },
    { value: 'icebreakers', label: 'Ice Breakers', icon: <MessageCircle className="w-4 h-4" /> },
    { value: 'speed_dating', label: 'Speed Dating', icon: <Zap className="w-4 h-4" /> },
    { value: 'date_ideas', label: 'Date Ideas', icon: <Coffee className="w-4 h-4" /> },
    { value: 'relationship_advice', label: 'Advice', icon: <Heart className="w-4 h-4" /> },
    { value: 'first_dates', label: 'First Dates', icon: <Sparkles className="w-4 h-4" /> }
  ];

  const icebreakerQuestions = [
    "What's your ideal first date?",
    "Do you prefer cats or dogs?",
    "What's your love language?",
    "What are you looking for in a relationship?",
    "What's your favorite romantic movie?",
    "Where's the best place for a first date?",
    "What's your biggest dating pet peeve?",
    "How do you know when you like someone?"
  ];

  // Load data
  useEffect(() => {
    loadLiveStreams();
    loadGifts();

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
      
      // Clean up media stream
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
      }
      
      // End live stream if still active (fire and forget for cleanup)
      if (isLive && isHost && selectedStream) {
        supabase.from('live_rooms').update({ is_active: false }).eq('id', selectedStream.id);
        supabase.from('room_participants').delete().eq('room_id', selectedStream.id);
      }
    };
  }, []);

  useEffect(() => {
    if (streamId && liveStreams.length > 0) {
      const stream = liveStreams.find(s => s.id === streamId);
      if (stream) handleJoinStream(stream);
    }
  }, [streamId, liveStreams]);

  // Auto-end stream when user leaves or closes page (unless minimized)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isLive && isHost && selectedStream) {
        // End the stream before page unload
        handleStopLive();
        // Show confirmation dialog
        e.preventDefault();
        e.returnValue = 'Your live stream will end. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isLive && isHost && selectedStream) {
        // Page is hidden (minimized or tab switched)
        // Don't end stream on minimize, only on actual close/navigation away
        console.log('Page hidden, keeping stream alive for potential minimize');
      }
    };

    const handlePageHide = (e: PageTransitionEvent) => {
      if (isLive && isHost && selectedStream) {
        // User is navigating away or closing tab
        handleStopLive();
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      // Cleanup event listeners
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      
      // End stream if component unmounts while live
      if (isLive && isHost && selectedStream) {
        handleStopLive();
      }
    };
  }, [isLive, isHost, selectedStream]);

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

      if (selectedStream.room_type === 'speed_dating') {
        const timer = setInterval(() => {
          setSpeedDatingTimer(prev => {
            if (prev <= 1) {
              // Rotate participants
              rotateSpeedDatingParticipants();
              return 300;
            }
            return prev - 1;
          });
        }, 1000);
        return () => clearInterval(timer);
      }

      return () => {
        commentsSubscription.unsubscribe();
        clearInterval(interval);
        if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
      };
    }
  }, [selectedStream]);

  useEffect(() => {
    if (videoRef && localStream) {
      videoRef.srcObject = localStream;
    }
  }, [videoRef, localStream]);

  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments]);

  useEffect(() => {
    if (selectedStream && !isHost) {
      addSystemMessage(`👋 Welcome to ${selectedStream.host_name}'s stream!`);
    }
  }, [selectedStream, isHost]);

  // Data functions
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
            bio,
            relationship_intention,
            interests
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const streams: LiveStream[] = (data || []).map(room => ({
        id: room.id,
        host_id: room.host_id,
        host_name: room.host?.full_name || room.host?.username || `User_${room.host_id?.slice(0, 8)}`,
        host_username: room.host?.username || '',
        host_avatar: room.host?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(room.host?.username || 'User')}&background=B11D2D&color=fff`,
        title: room.title,
        category: room.category || 'entertainment',
        thumbnail_url: room.thumbnail_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(room.host?.username || 'Live')}&size=400&background=B11D2D&color=fff&format=png`,
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
        cost_per_minute: room.cost_per_minute,
        dating_focus: room.dating_focus,
        min_age_preference: room.min_age_preference,
        max_age_preference: room.max_age_preference,
        gender_preference: room.gender_preference
      }));

      setLiveStreams(streams);
    } catch (error) {
      console.error('Error loading live streams:', error);
      toast({ title: 'Error', description: 'Failed to load live streams', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadGifts = async () => {
    try {
      const { data, error } = await supabase
        .from('gifts')
        .select('*')
        .eq('is_active', true)
        .order('cost_coins', { ascending: true });

      if (error) throw error;
    } catch (error) {
      console.error('Error loading gifts:', error);
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
        user_name: msg.sender?.full_name || msg.sender?.username || `User_${msg.sender_id?.slice(0, 8)}`,
        user_avatar: msg.sender?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.sender?.username || 'User')}&background=B11D2D&color=fff`,
        user_vip_tier: msg.sender?.vip_tier,
        message: msg.content,
        created_at: msg.created_at,
        is_gift: msg.message_type === 'gift',
        is_dating_interest: msg.message_type === 'dating_interest'
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
            avatar_url,
            vip_tier,
            age,
            relationship_intention
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
        user_name: p.user?.full_name || p.user?.username || `User_${p.user_id?.slice(0, 8)}`,
        user_avatar: p.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.user?.username || 'User')}&background=B11D2D&color=fff`,
        user_vip_tier: p.user?.vip_tier,
        joined_at: p.joined_at,
        is_host: p.is_host,
        is_muted: p.is_muted,
        is_video_enabled: p.is_video_enabled,
        age: p.user?.age,
        relationship_intention: p.user?.relationship_intention
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

  // Event handlers
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
            host_name: host?.full_name || host?.username || `User_${payload.new.host_id?.slice(0, 8)}`,
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
      user_name: sender?.full_name || sender?.username || `User_${message.sender_id?.slice(0, 8)}`,
      user_avatar: sender?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(sender?.username || 'User')}&background=B11D2D&color=fff`,
      user_vip_tier: sender?.vip_tier,
      message: message.content,
      created_at: message.created_at,
      is_gift: message.message_type === 'gift',
      is_dating_interest: message.message_type === 'dating_interest'
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

      // Capture thumbnail from video stream and upload to Cloudinary
      let thumbnailUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email?.split('@')[0] || 'Live')}&size=400&background=B11D2D&color=fff&format=png`;
      
      if (videoTracks.length > 0) {
        try {
          // Create video element to capture frame
          const video = document.createElement('video');
          video.srcObject = stream;
          video.muted = true;
          video.playsInline = true;
          
          await new Promise((resolve) => {
            video.onloadedmetadata = resolve;
          });
          
          await video.play();
          
          // Create canvas to capture frame
          const canvas = document.createElement('canvas');
          canvas.width = 640;
          canvas.height = 360;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            // Draw video frame to canvas
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Convert canvas to blob
            const blob = await new Promise<Blob>((resolve) => {
              canvas.toBlob(resolve, 'image/jpeg', 0.8);
            });
            
            // Upload to Cloudinary
            const file = new File([blob], `stream-thumbnail-${Date.now()}.jpg`, { type: 'image/jpeg' });
            const uploadResult = await uploadToCloudinary(file, 'live_rooms');
            thumbnailUrl = uploadResult.url;
          }
          
          video.pause();
          video.srcObject = null;
        } catch (error) {
          console.error('Failed to capture thumbnail:', error);
          // Fall back to generated avatar
        }
      }

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
          viewer_count: 1,
          category: streamCategory,
          dating_focus: streamCategory,
          thumbnail_url: thumbnailUrl
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
        host_name: user.user_metadata?.full_name || user.user_metadata?.username || user.email?.split('@')[0] || `User_${user.id?.slice(0, 8)}`,
        host_username: user.email?.split('@')[0] || '',
        host_avatar: user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email?.split('@')[0] || 'User')}&background=B11D2D&color=fff`,
        title: streamTitle || `${user.email?.split('@')[0]}'s Stream`,
        category: streamCategory,
        thumbnail_url: thumbnailUrl,
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

      await supabase
        .from('profiles')
        .update({ coins_balance: profile.coins_balance - gift.cost_coins })
        .eq('id', user.id);

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

      await supabase.from('coin_transactions').insert([
        { user_id: user.id, amount: -gift.cost_coins, type: 'gift_sent', description: `Sent ${gift.name} to ${selectedStream.host_name}` },
        { user_id: selectedStream.host_id, amount: Math.floor(gift.cost_coins * 0.9), type: 'gift_received', description: `Received ${gift.name} from ${user.email?.split('@')[0]}` }
      ]);

      await supabase.from('messages').insert({
        room_id: selectedStream.id,
        sender_id: user.id,
        content: `sent a ${gift.name}! ${gift.icon_url}`,
        message_type: 'gift'
      });

      // Show animation
      const giftElement = document.createElement('div');
      giftElement.className = 'fixed inset-0 pointer-events-none flex items-center justify-center z-50';
      giftElement.innerHTML = `<div class="text-7xl sm:text-9xl animate-bounce">${gift.icon_url || '🎁'}</div>`;
      document.body.appendChild(giftElement);
      setTimeout(() => giftElement.remove(), 2000);

      setShowGiftMenu(false);
      toast({ title: 'Gift Sent!', description: `You sent a ${gift.name} to ${selectedStream.host_name}!` });
    } catch (error) {
      console.error('Error sending gift:', error);
    }
  };

  const handleDatingInterest = async () => {
    if (!selectedStream || !user) return;
    
    await supabase.from('messages').insert({ 
      room_id: selectedStream.id, 
      sender_id: user.id, 
      content: '💕 Interested in dating!', 
      message_type: 'dating_interest' 
    });
    
    // Update participant interest status
    setParticipants(prev => prev.map(p => 
      p.user_id === user.id ? { ...p, is_interested: true } : p
    ));
    
    const heartElement = document.createElement('div');
    heartElement.className = 'fixed inset-0 pointer-events-none flex items-center justify-center z-50';
    heartElement.innerHTML = `
      <div class="text-center">
        <div class="text-7xl sm:text-9xl animate-bounce">💕</div>
        <div class="text-white text-base sm:text-xl mt-4 font-bold animate-pulse bg-black/50 px-4 py-2 rounded-full">
          Interest Sent!
        </div>
      </div>
    `;
    document.body.appendChild(heartElement);
    setTimeout(() => heartElement.remove(), 2000);
  };

  const handleSendMatchRequest = async (targetUserId: string) => {
    if (!user || !selectedStream) return;
    
    try {
      const { data: existingMatch } = await supabase
        .from('stream_matches')
        .select('*')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${targetUserId}),and(user1_id.eq.${targetUserId},user2_id.eq.${user.id})`)
        .single();
      
      if (existingMatch) {
        toast({ title: 'Match Already Exists', description: 'You already have a match request with this user.' });
        return;
      }
      
      await supabase.from('stream_matches').insert({
        stream_id: selectedStream.id,
        user1_id: user.id,
        user2_id: targetUserId
      });
      
      toast({ title: 'Match Request Sent!', description: 'Your interest has been sent.' });
    } catch (error) {
      console.error('Error sending match request:', error);
      toast({ title: 'Error', description: 'Failed to send match request.', variant: 'destructive' });
    }
  };

  const handleLike = async () => {
    if (!selectedStream || !user) return;
    await supabase.from('messages').insert({ 
      room_id: selectedStream.id, 
      sender_id: user.id, 
      content: '❤️', 
      message_type: 'text' 
    });
    
    const heartElement = document.createElement('div');
    heartElement.className = 'fixed inset-0 pointer-events-none flex items-center justify-center z-50';
    heartElement.innerHTML = '<div class="text-7xl sm:text-9xl animate-ping">❤️</div>';
    document.body.appendChild(heartElement);
    setTimeout(() => heartElement.remove(), 1000);
  };

  const handleShare = () => {
    const streamUrl = `${window.location.origin}/live?stream=${selectedStream?.id}`;
    if (navigator.share) {
      navigator.share({ 
        title: `${selectedStream?.host_name}'s Live Stream`, 
        url: streamUrl 
      }).catch(() => {
        navigator.clipboard.writeText(streamUrl);
        toast({ title: 'Link Copied!', description: 'Stream link copied to clipboard.' });
      });
    } else {
      navigator.clipboard.writeText(streamUrl);
      toast({ title: 'Link Copied!', description: 'Stream link copied to clipboard.' });
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && videoContainerRef.current) {
      videoContainerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const rotateSpeedDatingParticipants = () => {
    // Implement speed dating rotation logic
    addSystemMessage('🔄 Rotating participants... Find your next conversation!');
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
      'US': '🇺🇸', 'UK': '🇬🇧', 'CA': '🇨🇦', 'AU': '🇦🇺',
      'RW': '🇷🇼', 'KE': '🇰🇪', 'UG': '🇺🇬', 'TZ': '🇹🇿'
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

  // Live Stream Player View (Mobile-First)
  if (selectedStream) {
    return (
      <AuthGuard>
        <div className="h-screen bg-black relative overflow-hidden flex flex-col">
          {/* Video Container */}
          <div 
            ref={videoContainerRef}
            className="relative flex-1 bg-black"
          >
            {/* Video Player */}
            <div className="absolute inset-0">
              {isHost && localStream ? (
                <video
                  ref={(el) => setVideoRef(el)}
                  autoPlay
                  playsInline
                  muted={isMuted}
                  className="w-full h-full object-contain"
                />
              ) : (
                <LiveThumbnail
                  stream={selectedStream}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent pointer-events-none" />

            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleLeaveStream}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 rounded-full w-8 h-8 p-0"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>

                <div className="flex items-center gap-2">
                  <Avatar className="w-8 h-8 ring-2 ring-rose-500">
                    <AvatarImage src={selectedStream.host_avatar} />
                    <AvatarFallback className="text-xs">{selectedStream.host_name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-white text-sm font-semibold">{selectedStream.host_name}</h2>
                    <p className="text-white/60 text-xs line-clamp-1 max-w-[120px]">{selectedStream.title}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm">
                  <Eye className="w-3 h-3 text-white" />
                  <span className="text-white text-xs">{viewerCount}</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-rose-600">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  <span className="text-white text-xs font-medium">LIVE</span>
                </div>
                <Button
                  onClick={toggleFullscreen}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 rounded-full w-8 h-8 p-0"
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Speed Dating Timer */}
            {selectedStream.room_type === 'speed_dating' && (
              <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/10">
                <div className="flex items-center gap-1 text-white text-xs">
                  <Clock className="w-3 h-3 text-rose-400" />
                  <span>Next: {Math.floor(speedDatingTimer / 60)}:{String(speedDatingTimer % 60).padStart(2, '0')}</span>
                </div>
              </div>
            )}

            {/* Host Info (Mobile) */}
            <Button
              onClick={() => setShowProfileCard(true)}
              variant="ghost"
              size="sm"
              className="absolute left-3 top-20 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5 text-white text-xs flex items-center gap-1"
            >
              <User className="w-3 h-3" />
              About Host
            </Button>

            {/* Participants Button */}
            <Button
              onClick={() => setShowParticipants(true)}
              variant="ghost"
              size="sm"
              className="absolute right-3 top-20 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5 text-white text-xs flex items-center gap-1"
            >
              <Users className="w-3 h-3" />
              {participants.length}
            </Button>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isHost ? (
                    <>
                      <Button
                        onClick={handleToggleVideo}
                        variant="ghost"
                        size="sm"
                        className={`w-10 h-10 rounded-full ${
                          isVideoOff ? 'bg-rose-600' : 'bg-white/20'
                        } text-white`}
                      >
                        {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                      </Button>
                      <Button
                        onClick={handleToggleAudio}
                        variant="ghost"
                        size="sm"
                        className={`w-10 h-10 rounded-full ${
                          isMuted ? 'bg-rose-600' : 'bg-white/20'
                        } text-white`}
                      >
                        {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={handleDatingInterest}
                      variant="ghost"
                      size="sm"
                      className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white"
                    >
                      <Heart className="w-5 h-5" />
                    </Button>
                  )}

                  <Button
                    onClick={() => setShowGiftMenu(true)}
                    variant="ghost"
                    size="sm"
                    className="w-10 h-10 rounded-full bg-white/20 text-white"
                  >
                    <Gift className="w-5 h-5" />
                  </Button>

                  <Button
                    onClick={handleLike}
                    variant="ghost"
                    size="sm"
                    className="w-10 h-10 rounded-full bg-white/20 text-white"
                  >
                    <ThumbsUp className="w-5 h-5" />
                  </Button>

                  <Button
                    onClick={() => setShowIcebreakers(true)}
                    variant="ghost"
                    size="sm"
                    className="w-10 h-10 rounded-full bg-white/20 text-white"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </Button>
                </div>

                <Button
                  onClick={() => setIsChatVisible(!isChatVisible)}
                  variant="ghost"
                  size="sm"
                  className="px-3 py-2 rounded-full bg-white/20 text-white flex items-center gap-1"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-xs">{comments.length}</span>
                </Button>
              </div>

              {isHost && (
                <Button
                  onClick={handleStopLive}
                  className="mt-2 w-full bg-rose-600 text-white text-sm py-2 rounded-full"
                >
                  End Stream
                </Button>
              )}
            </div>
          </div>

          {/* Chat Panel (Mobile) */}
          <AnimatePresence>
            {isChatVisible && (
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25 }}
                className="absolute bottom-0 left-0 right-0 h-2/3 bg-gray-900 rounded-t-2xl border-t border-white/10 flex flex-col z-20"
              >
                <div className="p-3 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-medium">Live Chat</h3>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-white/60 text-xs">{viewerCount}</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => setIsChatVisible(false)}
                    variant="ghost"
                    size="sm"
                    className="text-white/60 hover:text-white"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </Button>
                </div>

                <div 
                  ref={chatContainerRef}
                  className="flex-1 overflow-y-auto p-3 space-y-3"
                >
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex items-start gap-2">
                      <Avatar className="w-6 h-6 flex-shrink-0">
                        <AvatarImage src={comment.user_avatar} />
                        <AvatarFallback className="text-xs">{comment.user_name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white font-medium text-xs">{comment.user_name}</span>
                          {comment.user_vip_tier && comment.user_vip_tier !== 'free' && (
                            <Crown className="w-3 h-3 text-amber-500" />
                          )}
                          <span className="text-white/40 text-xs">{formatTime(comment.created_at)}</span>
                        </div>
                        <p className={cn(
                          "text-sm break-words",
                          comment.is_system ? 'text-purple-400' : 
                          comment.is_gift ? 'text-amber-400' : 
                          comment.is_dating_interest ? 'text-pink-400' : 'text-white/90'
                        )}>
                          {comment.message}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={commentsEndRef} />
                </div>

                <div className="p-3 border-t border-white/10">
                  {replyToComment && (
                    <div className="flex items-center justify-between bg-purple-900/30 p-2 rounded-lg mb-2">
                      <span className="text-xs text-white/80">
                        Replying to @{replyToComment.user_name}
                      </span>
                      <Button onClick={() => setReplyToComment(null)} variant="ghost" size="sm" className="h-5 w-5 p-0">
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendComment()}
                      placeholder="Type a message..."
                      className="flex-1 bg-white/10 text-white placeholder-white/40 border-white/10 text-sm h-10"
                    />
                    <Button
                      onClick={handleSendComment}
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700 text-white h-10 w-10 p-0"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Participants Panel */}
          <AnimatePresence>
            {showParticipants && (
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                className="absolute inset-0 bg-gray-900 z-30 flex flex-col"
              >
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <h3 className="text-white font-semibold">Viewers ({viewerCount})</h3>
                  <Button onClick={() => setShowParticipants(false)} variant="ghost" size="sm" className="text-white">
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  {participants.map(p => (
                    <div 
                      key={p.id} 
                      className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg cursor-pointer"
                      onClick={() => {
                        setSelectedParticipant(p);
                        setShowParticipants(false);
                      }}
                    >
                      <ParticipantAvatar participant={p} size="md" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{p.user_name}</span>
                          {p.is_host && <Star className="w-3 h-3 text-amber-500" />}
                          {p.is_interested && <Heart className="w-3 h-3 text-rose-500" />}
                        </div>
                        {p.age && <p className="text-white/60 text-xs">Age {p.age}</p>}
                      </div>
                      {!p.is_host && p.user_id !== user.id && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendMatchRequest(p.user_id);
                          }}
                          size="sm"
                          className="bg-rose-500 text-white text-xs px-3 py-1 rounded-full"
                        >
                          Match
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Profile Card */}
          <AnimatePresence>
            {showProfileCard && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 z-30 flex items-center justify-center p-4"
                onClick={() => setShowProfileCard(false)}
              >
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                  className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-center mb-4">
                    <Avatar className="w-20 h-20 mx-auto mb-3 ring-4 ring-rose-500">
                      <AvatarImage src={selectedStream.host_avatar} />
                      <AvatarFallback className="text-2xl">{selectedStream.host_name[0]}</AvatarFallback>
                    </Avatar>
                    <h3 className="text-white font-semibold text-lg">{selectedStream.host_name}</h3>
                    {selectedStream.age && (
                      <p className="text-white/60 text-sm">Age {selectedStream.age}</p>
                    )}
                  </div>

                  <div className="space-y-3 mb-4">
                    {selectedStream.city && (
                      <div className="flex items-center gap-2 text-white/80 text-sm">
                        <MapPin className="w-4 h-4" />
                        <span>{getCountryFlag(selectedStream.country)} {selectedStream.city}</span>
                      </div>
                    )}
                    
                    <p className="text-white/80 text-sm">{selectedStream.bio || 'No bio yet'}</p>

                    {!isHost && (
                      <>
                        <div className="pt-2">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-white/80">Match Compatibility</span>
                            <span className="text-rose-400 font-semibold">85%</span>
                          </div>
                          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                            <div className="w-[85%] h-full bg-gradient-to-r from-rose-500 to-purple-500" />
                          </div>
                        </div>

                        <Button
                          onClick={() => {
                            handleSendMatchRequest(selectedStream.host_id);
                            setShowProfileCard(false);
                          }}
                          className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-xl"
                        >
                          <Heart className="w-4 h-4 mr-2" />
                          Send Match Request
                        </Button>
                      </>
                    )}
                  </div>

                  <Button
                    onClick={() => setShowProfileCard(false)}
                    variant="outline"
                    className="w-full border-white/10 text-white hover:bg-white/10"
                  >
                    Close
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Icebreakers Menu */}
          <AnimatePresence>
            {showIcebreakers && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="absolute bottom-24 left-4 right-4 bg-gray-900 rounded-2xl border border-white/10 p-4 z-30"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold">Icebreaker Questions</h3>
                  <Button onClick={() => setShowIcebreakers(false)} variant="ghost" size="sm" className="text-white/60">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {icebreakerQuestions.map((question) => (
                    <button
                      key={question}
                      onClick={() => {
                        setNewComment(question);
                        setShowIcebreakers(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-white/10 rounded-lg text-sm text-white/90"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Gift Menu Modal */}
          <AnimatePresence>
            {showGiftMenu && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50"
                onClick={() => setShowGiftMenu(false)}
              >
                <div onClick={(e) => e.stopPropagation()} className="w-full">
                  <GiftInventory onSendGift={handleSendGift} onClose={() => setShowGiftMenu(false)} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Participant Profile Modal */}
          <AnimatePresence>
            {selectedParticipant && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                onClick={() => setSelectedParticipant(null)}
              >
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                  className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-center mb-4">
                    <Avatar className="w-20 h-20 mx-auto mb-3 ring-4 ring-rose-500">
                      <AvatarImage src={selectedParticipant.user_avatar} />
                      <AvatarFallback className="text-2xl">{selectedParticipant.user_name[0]}</AvatarFallback>
                    </Avatar>
                    <h3 className="text-white font-semibold text-lg">{selectedParticipant.user_name}</h3>
                    {selectedParticipant.age && (
                      <p className="text-white/60 text-sm">Age {selectedParticipant.age}</p>
                    )}
                  </div>

                  {selectedParticipant.relationship_intention && (
                    <div className="mb-4">
                      <p className="text-white/80 text-sm text-center">{selectedParticipant.relationship_intention}</p>
                    </div>
                  )}

                  {selectedParticipant.user_id !== user.id && !selectedParticipant.is_host && (
                    <Button
                      onClick={() => {
                        handleSendMatchRequest(selectedParticipant.user_id);
                        setSelectedParticipant(null);
                      }}
                      className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-xl mb-2"
                    >
                      <Heart className="w-4 h-4 mr-2" />
                      Send Match Request
                    </Button>
                  )}

                  <Button
                    onClick={() => setSelectedParticipant(null)}
                    variant="outline"
                    className="w-full border-white/10 text-white hover:bg-white/10"
                  >
                    Close
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </AuthGuard>
    );
  }

  // Live Streams Grid View (Mobile-First)
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-purple-50 dark:from-gray-900 dark:to-gray-950">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-rose-200 dark:border-rose-900/30">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => navigate('/dashboard')}
                  variant="ghost"
                  size="sm"
                  className="lg:hidden text-gray-700 dark:text-gray-300"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
                    Live Dating
                  </h1>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Connect in real-time
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  onClick={() => setShowGoLive(true)}
                  className="bg-gradient-to-r from-rose-500 to-purple-500 text-white text-sm h-9 px-3"
                >
                  <Video className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Go Live</span>
                </Button>
                <Button
                  onClick={() => setShowMobileMenu(true)}
                  variant="ghost"
                  size="sm"
                  className="lg:hidden"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto mt-3 pb-1 scrollbar-hide">
              {categories.map((category) => (
                <Button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  variant={selectedCategory === category.value ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    "whitespace-nowrap flex items-center gap-1 rounded-full px-3 py-1.5 text-xs",
                    selectedCategory === category.value
                      ? 'bg-gradient-to-r from-rose-500 to-purple-500 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                  )}
                >
                  {category.icon}
                  <span className="hidden xs:inline">{category.label}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 py-4">
          {/* New Stream Notification */}
          <AnimatePresence>
            {newStreamNotification && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-4"
              >
                <div 
                  className="bg-gradient-to-r from-rose-600 to-purple-600 text-white p-3 rounded-xl shadow-lg cursor-pointer"
                  onClick={() => handleJoinStream(newStreamNotification)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      <div>
                        <div className="font-medium text-sm">New Stream Started!</div>
                        <div className="text-xs opacity-90">
                          {newStreamNotification.host_name} is live
                        </div>
                      </div>
                    </div>
                    <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1 h-auto">
                      Join
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
                <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Loading streams...</p>
              </div>
            </div>
          )}

          {/* Live Streams Grid */}
          {!loading && (
            <div className="space-y-4">
              {filteredStreams.map((stream, index) => (
                <motion.div
                  key={stream.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  onClick={() => handleJoinStream(stream)}
                  className="cursor-pointer"
                >
                  <Card className="border-0 shadow-md overflow-hidden bg-white dark:bg-gray-900">
                    <div className="flex gap-3">
                      {/* Thumbnail */}
                      <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0">
                        <LiveThumbnail
                          stream={stream}
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Room Type Badge */}
                        <div className="absolute top-1 left-1">
                          <Badge className="bg-black/50 backdrop-blur-sm text-white border-white/20 text-[10px] px-1 py-0">
                            {getRoomTypeIcon(stream.room_type)}
                          </Badge>
                        </div>

                        {/* Viewer Count */}
                        <div className="absolute bottom-1 right-1 flex items-center gap-0.5 px-1 py-0.5 rounded bg-black/50 backdrop-blur-sm text-white text-[10px]">
                          <Eye className="w-2.5 h-2.5" />
                          <span>{stream.viewer_count}</span>
                        </div>
                      </div>

                      {/* Stream Info */}
                      <CardContent className="p-3 flex-1">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="font-semibold text-sm line-clamp-1 text-gray-900 dark:text-gray-100">
                            {stream.title}
                          </h3>
                          <Badge className="text-[10px] bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-0 ml-1">
                            {stream.category}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="w-5 h-5">
                            <AvatarImage src={stream.host_avatar} />
                            <AvatarFallback className="text-[10px]">{stream.host_name[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-gray-600 dark:text-gray-400">{stream.host_name}</span>
                          {stream.host_verified && (
                            <Shield className="w-3 h-3 text-emerald-500" />
                          )}
                        </div>

                        {(stream.city || stream.country) && (
                          <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 mb-2">
                            <MapPin className="w-2.5 h-2.5" />
                            <span>{getCountryFlag(stream.country)} {stream.city || stream.country}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-500 dark:text-gray-400">
                            {formatDuration(Math.floor((Date.now() - new Date(stream.started_at).getTime()) / 1000))}
                          </span>
                          <Button size="sm" className="h-7 px-3 text-xs bg-gradient-to-r from-rose-500 to-purple-500 text-white">
                            Join
                          </Button>
                        </div>
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
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Video className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-base font-semibold mb-1 text-gray-900 dark:text-gray-100">
                No live streams
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {selectedCategory === 'all' 
                  ? 'Check back later'
                  : `No streams in ${selectedCategory}`}
              </p>
              {selectedCategory !== 'all' && (
                <Button onClick={() => setSelectedCategory('all')} size="sm" className="text-sm">
                  View All
                </Button>
              )}
            </motion.div>
          )}
        </div>

        {/* Mobile Menu */}
        <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
          <SheetContent side="right" className="bg-white dark:bg-gray-900 w-64">
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

        {/* Go Live Modal */}
        <AnimatePresence>
          {showGoLive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50"
              onClick={() => setShowGoLive(false)}
            >
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25 }}
                className="w-full bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl max-w-md mx-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-5">
                  <div className="text-center mb-4">
                    <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-r from-rose-500 to-purple-500 flex items-center justify-center">
                      <Video className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-lg font-bold mb-1 text-gray-900 dark:text-gray-100">
                      Go Live
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Start your own live stream
                    </p>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Stream Title
                      </label>
                      <Input
                        placeholder="Enter title..."
                        value={streamTitle}
                        onChange={(e) => setStreamTitle(e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Category
                      </label>
                      <select 
                        value={streamCategory}
                        onChange={(e) => setStreamCategory(e.target.value)}
                        className="w-full h-9 px-3 text-sm border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
                      >
                        <option value="icebreakers">Ice Breakers</option>
                        <option value="speed_dating">Speed Dating</option>
                        <option value="date_ideas">Date Ideas</option>
                        <option value="relationship_advice">Advice</option>
                        <option value="first_dates">First Dates</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Stream Type
                      </label>
                      <select 
                        value={streamType}
                        onChange={(e) => setStreamType(e.target.value as any)}
                        className="w-full h-9 px-3 text-sm border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
                      >
                        <option value="public">Public (Free)</option>
                        <option value="private">Private (Paid)</option>
                        <option value="speed_dating">Speed Dating</option>
                      </select>
                    </div>

                    {streamType === 'private' && (
                      <div>
                        <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                          Cost per Minute (Coins)
                        </label>
                        <Input
                          type="number"
                          min={0}
                          value={costPerMinute}
                          onChange={(e) => setCostPerMinute(parseInt(e.target.value))}
                          className="h-9 text-sm"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={() => setShowGoLive(false)} variant="outline" className="flex-1 text-sm h-9">
                      Cancel
                    </Button>
                    <Button onClick={handleStartLive} className="flex-1 bg-gradient-to-r from-rose-500 to-purple-500 text-white text-sm h-9">
                      <Video className="w-4 h-4 mr-2" />
                      Start
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