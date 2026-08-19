import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Video, VideoOff, Mic, MicOff, Gift, Heart, Users, Eye, 
  Share2, Sparkles, Crown, Star, Music, Gamepad2, Coffee,
  Book, Camera, X, ChevronLeft, ChevronRight, MessageCircle,
  Send, Maximize2, Minimize2, Settings, ThumbsUp, Flame,
  Zap, Globe, MapPin, Clock, AlertCircle, Shield, ChevronDown,
  ChevronUp, Move, Pin, PinOff, Loader2, User, UserPlus, Menu, Lock,
  Wifi, WifiOff, Volume2, VolumeX, Download, Award, Gem, BarChart3, Plus,
  Image, Smile, Film
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  is_image?: boolean;
  message_type?: string;
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
  role: 'viewer' | 'co-host' | 'host';
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
    <div className={cn("relative w-full h-full overflow-hidden bg-slate-900", className)}>
      <img
        src={stream.thumbnail_url}
        alt={`${stream.host_name}'s live stream`}
        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        loading="lazy"
        onError={(e) => {
          // Fallback to generated placeholder if thumbnail fails to load
          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(stream.host_name)}&size=400&background=B11D2D&color=fff&format=png`;
        }}
      />
      {stream.is_active && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-600 text-white text-[10px] font-bold tracking-wide shadow-lg">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          LIVE
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent" />
      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-white text-xs font-medium">
        <Users className="w-3 h-3" />
        {stream.viewer_count.toLocaleString()}
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-slate-950/95 backdrop-blur-xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-white/10 w-full max-w-lg mx-auto"
    >
      <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between sticky top-0 bg-slate-950/95 z-10">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Gift className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">Gift Shop</h3>
            <p className="text-white/40 text-xs">Send love & support</p>
          </div>
        </div>
        <Button onClick={onClose} variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10 rounded-full h-9 w-9">
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="p-4 sm:p-5 max-h-[70vh] overflow-y-auto">
        {/* Tier Filters */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
          {tiers.map((tier) => (
            <button
              key={tier.id}
              onClick={() => setSelectedTier(tier.id)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all border",
                selectedTier === tier.id
                  ? `bg-gradient-to-r ${getTierColor(tier.id)} text-white border-transparent shadow-lg`
                  : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'
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
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onSendGift(gift)}
                className="relative bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-2xl p-3 transition-all group text-left"
              >
                <div className="relative mb-3">
                  <div className={cn(
                    "w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform",
                    getTierColor(gift.tier)
                  )}>
                    {gift.icon_url || '🎁'}
                  </div>
                  {gift.tier === 'legendary' && (
                    <Sparkles className="absolute -top-1 -right-2 w-4 h-4 text-yellow-400 animate-pulse" />
                  )}
                </div>
                <h4 className="text-white font-semibold text-xs text-center mb-0.5 line-clamp-1">{gift.name}</h4>
                <p className="text-white/50 text-[10px] text-center mb-2 line-clamp-1">{gift.name_local}</p>
                <div className="flex items-center justify-center gap-1 text-rose-400 font-bold text-xs bg-rose-500/10 rounded-full py-1.5">
                  <Gem className="w-3 h-3" />
                  {gift.cost_coins}
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

const GuestSlot: React.FC<{ guest?: RoomParticipant; onRemove?: () => void }> = ({ guest, onRemove }) => {
  return (
    <div className="relative w-24 h-full lg:w-full lg:h-28 flex-shrink-0 rounded-xl bg-slate-800/80 border border-white/10 overflow-hidden flex flex-col items-center justify-center">
      {guest ? (
        <>
          <Avatar className="w-10 h-10 ring-2 ring-white/20">
            <AvatarImage src={guest.user_avatar} />
            <AvatarFallback className="bg-gradient-to-r from-rose-500 to-purple-500 text-white text-sm">
              {guest.user_name[0]}
            </AvatarFallback>
          </Avatar>
          <p className="text-white text-[10px] font-medium truncate px-2 mt-1 max-w-full">
            {guest.user_name}
          </p>
          <div className="absolute top-1.5 right-1.5 text-white/40">
            <Camera className="w-3.5 h-3.5" />
          </div>
          {onRemove && (
            <button
              onClick={onRemove}
              className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-rose-500/90 flex items-center justify-center text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center text-white/30">
          <Camera className="w-6 h-6 mb-1" />
          <span className="text-[10px]">Empty</span>
        </div>
      )}
    </div>
  );
};

interface PollCreatorProps {
  show: boolean;
  onClose: () => void;
  question: string;
  setQuestion: (q: string) => void;
  options: string[];
  setOptions: (opts: string[]) => void;
  onStart: () => void;
}

const PollCreator: React.FC<PollCreatorProps> = ({ show, onClose, question, setQuestion, options, setOptions, onStart }) => {
  if (!show) return null;

  const updateOption = (index: number, value: string) => {
    const next = [...options];
    next[index] = value;
    setOptions(next);
  };

  const addOption = () => {
    if (options.length < 4) setOptions([...options, '']);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) setOptions(options.filter((_, i) => i !== index));
  };

  const canStart = question.trim().length > 0 && options.filter(o => o.trim()).length >= 2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute bottom-24 left-3 right-3 sm:left-auto sm:right-3 sm:w-80 z-40 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold text-sm flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-rose-400" />
          Create Poll
        </h3>
        <Button onClick={onClose} variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10 rounded-full">
          <X className="w-4 h-4" />
        </Button>
      </div>
      <div className="space-y-3">
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question..."
          className="bg-white/10 text-white placeholder-white/40 border-white/10 text-sm h-10"
        />
        {options.map((opt, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={opt}
              onChange={(e) => updateOption(i, e.target.value)}
              placeholder={`Option ${i + 1}`}
              className="flex-1 bg-white/10 text-white placeholder-white/40 border-white/10 text-sm h-10"
            />
            {options.length > 2 && (
              <Button onClick={() => removeOption(i)} variant="ghost" size="icon" className="h-10 w-10 text-white/70 hover:text-rose-400">
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
        {options.length < 4 && (
          <Button onClick={addOption} variant="outline" className="w-full border-white/10 text-white hover:bg-white/10 text-sm h-9">
            <Plus className="w-4 h-4 mr-1.5" />
            Add Option
          </Button>
        )}
        <Button onClick={onStart} disabled={!canStart} className="w-full bg-gradient-to-r from-rose-500 to-purple-600 text-white text-sm h-10">
          Start Poll
        </Button>
      </div>
    </motion.div>
  );
};

interface ActivePollPanelProps {
  activePoll: { id: string; question: string; options: string[] };
  pollVotes: Record<string, Record<string, number>>;
  isHost: boolean;
  onVote: (index: number) => void;
  onEndPoll: () => void;
}

const ActivePollPanel: React.FC<ActivePollPanelProps> = ({ activePoll, pollVotes, isHost, onVote, onEndPoll }) => {
  const currentVotes = pollVotes[activePoll.id] || {};
  const total = Object.values(currentVotes).reduce((a, b) => a + b, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-gradient-to-br from-purple-900/90 to-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 mb-3 shadow-lg"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold text-sm flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-rose-400" />
          Live Poll
        </h3>
        {isHost && (
          <Button onClick={onEndPoll} size="sm" variant="ghost" className="text-rose-400 hover:bg-rose-500/10 h-8 px-2 text-xs">
            End Poll
          </Button>
        )}
      </div>
      <p className="text-white/90 text-sm font-medium mb-3">{activePoll.question}</p>
      <div className="space-y-2">
        {activePoll.options.map((option, index) => {
          const count = currentVotes[index.toString()] || 0;
          const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <button
              key={index}
              onClick={() => !isHost && onVote(index)}
              disabled={isHost}
              className="w-full text-left group disabled:cursor-default"
            >
              <div className="flex items-center justify-between text-xs text-white/80 mb-1">
                <span className="flex items-center gap-2">
                  {!isHost && <ThumbsUp className="w-3 h-3 text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity" />}
                  {option}
                </span>
                <span className="font-medium">{percentage}% ({count})</span>
              </div>
              <Progress value={percentage} className="h-2" />
            </button>
          );
        })}
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
  const [isPractice, setIsPractice] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [comments, setComments] = useState<LiveComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showGifPanel, setShowGifPanel] = useState(false);
  const [gifQuery, setGifQuery] = useState('');
  const [gifResults, setGifResults] = useState<{ id: string; url: string; preview: string }[]>([]);
  const [gifLoading, setGifLoading] = useState(false);
  const [tagQuery, setTagQuery] = useState('');
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
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
  const [showMultiGuest, setShowMultiGuest] = useState(false);
  const [guests, setGuests] = useState<string[]>([]);
  const [showIcebreakers, setShowIcebreakers] = useState(false);
  const [showProfileCard, setShowProfileCard] = useState(false);
  const [speedDatingTimer, setSpeedDatingTimer] = useState(300);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [streamDuration, setStreamDuration] = useState(0);
  const [newStreamNotification, setNewStreamNotification] = useState<LiveStream | null>(null);
  const [replyToComment, setReplyToComment] = useState<LiveComment | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [bannedWords, setBannedWords] = useState<string[]>(['spam', 'scam']);
  const [newBannedWord, setNewBannedWord] = useState('');
  const [showModeration, setShowModeration] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<RoomParticipant | null>(null);
  const [activePoll, setActivePoll] = useState<{ id: string; question: string; options: string[] } | null>(null);
  const [pollVotes, setPollVotes] = useState<Record<string, Record<string, number>>>({});
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [newPollQuestion, setNewPollQuestion] = useState('');
  const [newPollOptions, setNewPollOptions] = useState<string[]>(['', '']);
  
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

  const STICKERS = [
    { id: 'heart', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/2764.svg', label: '❤️' },
    { id: 'joy', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f602.svg', label: '😂' },
    { id: 'fire', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f525.svg', label: '🔥' },
    { id: 'thumbsup', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f44d.svg', label: '👍' },
    { id: 'party', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f389.svg', label: '🎉' },
    { id: 'heart-eyes', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f60d.svg', label: '😍' },
    { id: 'sunglasses', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f60e.svg', label: '😎' },
    { id: 'two-hearts', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f495.svg', label: '💕' },
    { id: 'sparkles', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/2728.svg', label: '✨' },
    { id: 'rose', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f339.svg', label: '🌹' },
    { id: 'partying', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f973.svg', label: '🥳' },
    { id: 'kiss', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f48b.svg', label: '💋' }
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
      if (isLive && isHost && selectedStream && !isPractice) {
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
      if (isLive && isHost && selectedStream && !isPractice) {
        // End the stream before page unload
        handleStopLive();
        // Show confirmation dialog
        e.preventDefault();
        e.returnValue = 'Your live stream will end. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isLive && isHost && selectedStream && !isPractice) {
        // Page is hidden (minimized or tab switched)
        // Don't end stream on minimize, only on actual close/navigation away
        console.log('Page hidden, keeping stream alive for potential minimize');
      }
    };

    const handlePageHide = (e: PageTransitionEvent) => {
      if (isLive && isHost && selectedStream && !isPractice) {
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
      if (isLive && isHost && selectedStream && !isPractice) {
        handleStopLive();
      }
    };
  }, [isLive, isHost, selectedStream]);

  useEffect(() => {
    if (selectedStream) {
      if (isPractice) return;
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
  }, [selectedStream, isPractice]);

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
    const match = newComment.match(/@(\S*)$/);
    if (match) {
      setTagQuery(match[1]);
      setShowTagDropdown(true);
    } else {
      setShowTagDropdown(false);
    }
  }, [newComment]);

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

      // If no live streams from database, add mock data for testing
      let finalStreams = streams;
      if (!data || data.length === 0) {
        console.log('No live streams from database, using mock data');
        finalStreams = [
          {
            id: 'mock-live-1',
            host_id: 'mock-1',
            host_name: 'Sarah Johnson',
            host_username: 'sarah_j',
            host_avatar: 'https://picsum.photos/seed/sarah/200/200.jpg',
            title: '🎵 Live Music Session',
            category: 'music',
            thumbnail_url: 'https://picsum.photos/seed/music-live/400/200.jpg',
            viewer_count: 127,
            is_active: true,
            started_at: new Date(),
            host_vip_tier: 'premium',
            host_verified: true,
            tags: ['music', 'live', 'acoustic'],
            country: 'Rwanda',
            city: 'Kigali',
            age: 28,
            bio: 'Live music performance and chat with me!',
            room_type: 'public',
            max_viewers: 500,
            cost_per_minute: 0,
            dating_focus: undefined,
            min_age_preference: undefined,
            max_age_preference: undefined,
            gender_preference: undefined
          },
          {
            id: 'mock-live-2',
            host_id: 'mock-2',
            host_name: 'Michael Chen',
            host_username: 'mike_c',
            host_avatar: 'https://picsum.photos/seed/mike/200/200.jpg',
            title: '🎮 Gaming & Chill',
            category: 'gaming',
            thumbnail_url: 'https://picsum.photos/seed/gaming-live/400/200.jpg',
            viewer_count: 89,
            is_active: true,
            started_at: new Date(),
            host_vip_tier: 'platinum',
            host_verified: true,
            tags: ['gaming', 'chill', 'chat'],
            country: 'Kenya',
            city: 'Nairobi',
            age: 32,
            bio: 'Playing games and chatting with friends!',
            room_type: 'public',
            max_viewers: 500,
            cost_per_minute: 0,
            dating_focus: undefined,
            min_age_preference: undefined,
            max_age_preference: undefined,
            gender_preference: undefined
          },
          {
            id: 'mock-live-3',
            host_id: 'mock-3',
            host_name: 'Amina Hassan',
            host_username: 'amina_h',
            host_avatar: 'https://picsum.photos/seed/amina/200/200.jpg',
            title: '💕 Speed Dating Session',
            category: 'speed_dating',
            thumbnail_url: 'https://picsum.photos/seed/dating-live/400/200.jpg',
            viewer_count: 45,
            is_active: true,
            started_at: new Date(),
            host_vip_tier: 'premium',
            host_verified: true,
            tags: ['dating', 'speed_dating', 'meeting'],
            country: 'Tanzania',
            city: 'Dar es Salaam',
            age: 26,
            bio: 'Speed dating rounds - come join us!',
            room_type: 'speed_dating',
            max_viewers: 100,
            cost_per_minute: 5,
            dating_focus: 'serious_relationships',
            min_age_preference: 25,
            max_age_preference: 35,
            gender_preference: 'female'
          }
        ];
      }

      setLiveStreams(finalStreams);
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

      let loadedActivePoll: { id: string; question: string; options: string[] } | null = null;
      let loadedVotes: Record<string, Record<string, number>> = {};
      const loadedComments: LiveComment[] = [];

      (data || []).forEach((msg: any) => {
        const content = msg.content || '';
        if (msg.message_type === 'system') {
          if (content.startsWith('POLL|')) {
            try {
              const poll = JSON.parse(content.slice(5));
              if (poll.id && poll.question && Array.isArray(poll.options)) {
                loadedActivePoll = { id: poll.id, question: poll.question, options: poll.options };
                loadedVotes[poll.id] = {};
              }
            } catch (e) {
              console.error('Error parsing poll:', e);
            }
            return;
          }
          if (content.startsWith('POLL_END|')) {
            const pollId = content.split('|')[1];
            if (loadedActivePoll?.id === pollId) loadedActivePoll = null;
            return;
          }
          if (content.startsWith('VOTE|')) {
            const parts = content.split('|');
            const pollId = parts[1];
            const optionIndex = parts[2];
            if (pollId && optionIndex !== undefined) {
              loadedVotes[pollId] = loadedVotes[pollId] || {};
              loadedVotes[pollId][optionIndex] = (loadedVotes[pollId][optionIndex] || 0) + 1;
            }
            return;
          }
        }
        loadedComments.push({
          id: msg.id,
          user_id: msg.sender_id,
          user_name: msg.sender?.full_name || msg.sender?.username || `User_${msg.sender_id?.slice(0, 8)}`,
          user_avatar: msg.sender?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.sender?.username || 'User')}&background=B11D2D&color=fff`,
          user_vip_tier: msg.sender?.vip_tier,
          message: msg.content,
          created_at: msg.created_at,
          is_gift: msg.message_type === 'gift',
          is_dating_interest: msg.message_type === 'dating_interest',
          is_image: msg.message_type === 'image',
          message_type: msg.message_type
        });
      });

      setActivePoll(loadedActivePoll);
      setPollVotes(loadedVotes);
      console.log('Loaded stream comments:', loadedComments.length);
      setComments(loadedComments);
    } catch (error) {
      console.error('Error loading stream comments:', error);
      setComments([]);
    }
  };

  const loadRoomParticipants = async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('room_participants')
        .select('*, user:user_id(username, full_name, avatar_url, vip_tier, age, relationship_intention)')
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
        role: p.role === 'co-host' ? 'co-host' : (p.is_host ? 'host' : (p.role || 'viewer')),
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

  const processPollMessage = (content: string) => {
    if (content.startsWith('POLL|')) {
      try {
        const poll = JSON.parse(content.slice(5));
        if (poll.id && poll.question && Array.isArray(poll.options)) {
          setActivePoll({ id: poll.id, question: poll.question, options: poll.options });
          setPollVotes({ [poll.id]: {} });
        }
      } catch (e) {
        console.error('Error parsing poll:', e);
      }
      return;
    }
    if (content.startsWith('POLL_END|')) {
      const pollId = content.split('|')[1];
      setActivePoll(current => (current?.id === pollId ? null : current));
      return;
    }
    if (content.startsWith('VOTE|')) {
      const parts = content.split('|');
      const pollId = parts[1];
      const optionIndex = parts[2];
      if (pollId && optionIndex !== undefined) {
        setPollVotes(prev => {
          const current = prev[pollId] || {};
          return {
            ...prev,
            [pollId]: {
              ...current,
              [optionIndex]: (current[optionIndex] || 0) + 1
            }
          };
        });
      }
      return;
    }
  };

  const handleNewComment = async (message: any) => {
    if (!message) return;
    if (message.message_type === 'system') {
      const content = message.content || '';
      if (content.startsWith('POLL|') || content.startsWith('VOTE|') || content.startsWith('POLL_END|')) {
        processPollMessage(content);
        return;
      }
    }
    if (!message?.sender_id) return;
    try {
      // For the current user, avoid an extra query by using the existing user object
      let sender;
      if (user && user.id === message.sender_id) {
        sender = {
          username: user.user_metadata?.username || user.email?.split('@')[0] || 'User',
          full_name: user.user_metadata?.full_name || user.user_metadata?.username || user.email?.split('@')[0] || 'User',
          avatar_url: user.user_metadata?.avatar_url,
          vip_tier: user.user_metadata?.vip_tier
        };
      } else {
        const { data } = await supabase
          .from('profiles')
          .select('username, full_name, avatar_url, vip_tier')
          .eq('id', message.sender_id)
          .single();
        sender = data;
      }

      const newComment: LiveComment = {
        id: message.id,
        user_id: message.sender_id,
        user_name: sender?.full_name || sender?.username || `User_${message.sender_id?.slice(0, 8)}`,
        user_avatar: sender?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(sender?.username || 'User')}&background=B11D2D&color=fff`,
        user_vip_tier: sender?.vip_tier,
        message: message.content,
        created_at: message.created_at,
        is_gift: message.message_type === 'gift',
        is_dating_interest: message.message_type === 'dating_interest',
        is_image: message.message_type === 'image',
        message_type: message.message_type
      };

      setComments(prev =>
        prev.some(c => c.id === newComment.id) ? prev : [...prev, newComment]
      );
    } catch (error) {
      console.error('Error adding new comment:', error);
    }
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

  const handleStartPractice = async () => {
    if (!user) return;

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch (mediaError) {
        console.error('Media access error:', mediaError);

        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          toast({ title: "Video-Only Preview", description: "Microphone access denied, practicing with video only." });
          setIsMuted(true);
        } catch {
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
            toast({ title: "Audio-Only Preview", description: "Camera access denied, practicing with audio only." });
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

      const practiceStream: LiveStream = {
        id: 'practice',
        host_id: user.id,
        host_name: 'Practice',
        host_username: 'practice',
        host_avatar: `https://ui-avatars.com/api/?name=Practice&size=400&background=4F46E5&color=fff&format=png`,
        title: 'Practice Mode',
        category: 'practice',
        thumbnail_url: `https://ui-avatars.com/api/?name=Practice&size=400&background=4F46E5&color=fff&format=png`,
        viewer_count: 0,
        is_active: true,
        started_at: new Date(),
        host_vip_tier: 'free',
        host_verified: false,
        tags: [],
        room_type: 'public',
        max_viewers: 0,
        cost_per_minute: undefined,
        dating_focus: undefined,
        min_age_preference: undefined,
        max_age_preference: undefined,
        gender_preference: undefined
      };

      setIsHost(true);
      setIsLive(true);
      setIsPractice(true);
      setSelectedStream(practiceStream);

      toast({ title: 'Practice Mode Started', description: 'Preview your camera and mic. You are not live.' });
    } catch (error) {
      console.error('Error starting practice:', error);
      toast({ title: 'Error', description: 'Failed to start practice mode.', variant: 'destructive' });
    }
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
        // Handle payment for private stream
      }

      // Check if already a participant
      const { data: existingParticipant } = await supabase
        .from('room_participants')
        .select('*')
        .eq('room_id', stream.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingParticipant) {
        console.log('User is already a participant, skipping insertion');
        setSelectedStream(stream);
        toast({ title: 'Stream Joined', description: `You're already watching ${stream.host_name}'s stream.` });
        return;
      }

      // Add as participant
      const { data: participantData, error: participantError } = await supabase.from('room_participants').insert({
        room_id: stream.id,
        user_id: user.id,
        is_host: false,
        is_muted: false,
        is_video_enabled: true
      }).select().single();

      if (participantError) {
        console.error('Error joining stream as participant:', participantError);
        
        // Handle duplicate key error gracefully
        if (participantError.code === '23505') {
          console.log('User already exists as participant, continuing...');
          setSelectedStream(stream);
          toast({ title: 'Stream Joined', description: `You're already watching ${stream.host_name}'s stream.` });
          return;
        }
        
        toast({ 
          title: 'Error', 
          description: `Failed to join stream: ${participantError.message}`, 
          variant: 'destructive' 
        });
        return;
      }

      console.log('Successfully added as participant:', participantData);

      // Then send join message
      const { data: messageData, error: messageError } = await supabase.from('messages').insert({
        room_id: stream.id,
        sender_id: user.id,
        content: 'Joined the stream! 👋',
        message_type: 'text'
      }).select().single();

      if (messageError) {
        console.error('Error sending join message:', messageError);
      } else {
        console.log('Join message sent:', messageData);
      }

      setSelectedStream(stream);
      toast({ title: 'Joined Stream', description: `You are now watching ${stream.host_name}'s stream.` });
    } catch (error) {
      console.error('Error joining stream:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to join stream. Please try again.', 
        variant: 'destructive' 
      });
    }
  };

  const handleStopLive = async () => {
    if (!selectedStream || !user || !isHost) return;
    const wasPractice = isPractice;

    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }

    if (!wasPractice) {
      try {
        await supabase
          .from('live_rooms')
          .update({ is_active: false })
          .eq('id', selectedStream.id);

        await supabase
          .from('room_participants')
          .delete()
          .eq('room_id', selectedStream.id);
      } catch (error) {
        console.error('Error stopping stream:', error);
      }
    }

    setIsLive(false);
    setIsHost(false);
    setIsPractice(false);
    setIsVideoOff(true);
    setIsMuted(true);
    setLocalStream(null);
    setVideoRef(null);
    setSelectedStream(null);
    setComments([]);
    setParticipants([]);
    setViewerCount(0);

    toast({
      title: wasPractice ? 'Practice Ended' : 'Stream Ended',
      description: wasPractice ? 'You have left practice mode.' : 'Your live stream has ended successfully.'
    });
  };

  const handleLeaveStream = async () => {
    if (!selectedStream || !user) return;

    if (isHost) {
      await handleStopLive();
      return;
    }

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

  const handleKickParticipant = async (participant: RoomParticipant) => {
    if (!isHost || !selectedStream || !user || isPractice) return;
    if (participant.user_id === user.id) return;

    try {
      const { error } = await supabase
        .from('room_participants')
        .delete()
        .eq('id', participant.id);
      if (error) throw error;

      setParticipants(prev => prev.filter(p => p.id !== participant.id));
      setSelectedParticipant(null);
      toast({
        title: 'Participant Removed',
        description: `${participant.user_name} has been removed from the stream.`
      });
    } catch (error) {
      console.error('Error kicking participant:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove participant.',
        variant: 'destructive'
      });
    }
  };

  const handleToggleParticipantMute = async (participant: RoomParticipant) => {
    if (!isHost || !selectedStream || !user || isPractice) return;

    try {
      const { error } = await supabase
        .from('room_participants')
        .update({ is_muted: !participant.is_muted })
        .eq('id', participant.id);
      if (error) throw error;

      setParticipants(prev => prev.map(p =>
        p.id === participant.id ? { ...p, is_muted: !p.is_muted } : p
      ));
      setSelectedParticipant(null);
      toast({
        title: participant.is_muted ? 'Participant Unmuted' : 'Participant Muted',
        description: `${participant.user_name} is now ${participant.is_muted ? 'unmuted' : 'muted'}.`
      });
    } catch (error) {
      console.error('Error toggling participant mute:', error);
      toast({
        title: 'Error',
        description: 'Failed to update participant.',
        variant: 'destructive'
      });
    }
  };

  const handlePromoteToCoHost = async (participant: RoomParticipant) => {
    if (!isHost || !selectedStream || !user || isPractice) return;
    if (participant.user_id === user.id) return;

    try {
      const { error: hostError } = await supabase
        .from('room_participants')
        .update({ is_host: true })
        .eq('id', participant.id);
      if (hostError) throw hostError;

      // Try to set role to 'co-host' if the column exists (new schema)
      const { error: roleUpdateError } = await supabase
        .from('room_participants')
        .update({ role: 'co-host' })
        .eq('id', participant.id);
      if (roleUpdateError) {
        console.warn('Could not update role column, continuing with is_host only:', roleUpdateError);
      }

      setParticipants(prev => prev.map(p =>
        p.id === participant.id ? { ...p, role: 'co-host', is_host: true } : p
      ));
      setSelectedParticipant(null);
      toast({
        title: 'Co-host Added',
        description: `${participant.user_name} is now a co-host.`
      });
    } catch (error) {
      console.error('Error promoting co-host:', error);
      toast({
        title: 'Error',
        description: 'Failed to promote co-host.',
        variant: 'destructive'
      });
    }
  };

  const handleToggleGuest = (participantId: string) => {
    setGuests(prev => {
      if (prev.includes(participantId)) {
        return prev.filter(id => id !== participantId);
      }
      if (prev.length >= 5) return prev;
      return [...prev, participantId];
    });
  };

  const handleClearGuests = () => setGuests([]);

  const handleCopyInviteLink = () => {
    if (!selectedStream || isPractice) return;
    const link = `${window.location.origin}/live?stream=${selectedStream.id}`;
    navigator.clipboard.writeText(link).then(() => {
      toast({ title: 'Invite Link Copied', description: 'Share it to invite viewers to your live.' });
    });
  };

  const handleSendComment = async () => {
    if (!newComment.trim() || !selectedStream || !user || isPractice) {
      console.log('Message validation failed:', { 
        hasComment: !!newComment.trim(), 
        hasStream: !!selectedStream, 
        hasUser: !!user 
      });
      return;
    }

    try {
      console.log('Attempting to send message:', {
        room_id: selectedStream.id,
        sender_id: user.id,
        content: newComment,
        message_type: 'text'
      });

      // Check if user is a participant in the room
      const { data: participant, error: participantError } = await supabase
        .from('room_participants')
        .select('*')
        .eq('room_id', selectedStream.id)
        .eq('user_id', user.id)
        .single();

      if (participantError && participantError.code !== 'PGRST116') {
        console.error('Error checking participant status:', participantError);
      }

      // If not a participant, add them first
      if (!participant) {
        console.log('User is not a participant, adding them first...');
        const { error: addParticipantError } = await supabase.from('room_participants').insert({
          room_id: selectedStream.id,
          user_id: user.id,
          is_host: false,
          is_muted: false,
          is_video_enabled: true
        });

        if (addParticipantError) {
          console.error('Error adding participant:', addParticipantError);
          toast({ 
            title: 'Error', 
            description: 'Failed to join the stream. Please try refreshing.', 
            variant: 'destructive' 
          });
          return;
        }
        
        console.log('User added as participant successfully');
      }

      // Now send the message
      const { data, error } = await supabase.from('messages').insert({
        room_id: selectedStream.id,
        sender_id: user.id,
        content: newComment,
        message_type: 'text'
      }).select().single();

      if (error) {
        console.error('Database error sending message:', error);
        toast({
          title: 'Error',
          description: `Failed to send message: ${error.message}`,
          variant: 'destructive'
        });
        return;
      }

      console.log('Message sent successfully:', data);

      // Show the message in chat immediately
      if (data) {
        await handleNewComment(data);
      }

      setNewComment('');
      setReplyToComment(null);

      toast({
        title: 'Message Sent',
        description: 'Your message was sent successfully!',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error sending comment:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to send message. Please try again.', 
        variant: 'destructive' 
      });
    }
  };

  const handleSendImageMessage = async (content: string) => {
    if (!content || !selectedStream || !user || isPractice) return;

    try {
      const { data: participant, error: participantError } = await supabase
        .from('room_participants')
        .select('*')
        .eq('room_id', selectedStream.id)
        .eq('user_id', user.id)
        .single();

      if (participantError && participantError.code !== 'PGRST116') {
        console.error('Error checking participant status:', participantError);
      }

      if (!participant) {
        const { error: addParticipantError } = await supabase.from('room_participants').insert({
          room_id: selectedStream.id,
          user_id: user.id,
          is_host: false,
          is_muted: false,
          is_video_enabled: true
        });

        if (addParticipantError) {
          toast({
            title: 'Error',
            description: 'Failed to join the stream. Please try refreshing.',
            variant: 'destructive'
          });
          return;
        }
      }

      const { data, error } = await supabase.from('messages').insert({
        room_id: selectedStream.id,
        sender_id: user.id,
        content,
        message_type: 'image'
      }).select().single();

      if (error) {
        toast({
          title: 'Error',
          description: `Failed to send image: ${error.message}`,
          variant: 'destructive'
        });
        return;
      }

      if (data) {
        await handleNewComment(data);
      }
    } catch (error) {
      console.error('Error sending image message:', error);
      toast({ title: 'Error', description: 'Failed to send image.', variant: 'destructive' });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedStream || !user || isPractice) return;

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${user.id}-${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(fileName, file, { upsert: false });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('chat-images').getPublicUrl(fileName);
      const publicUrl = data.publicUrl;

      await handleSendImageMessage(publicUrl);
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({ title: 'Upload Failed', description: 'Could not upload image.', variant: 'destructive' });
      setIsUploading(false);
    }
  };

  const handleSelectSticker = async (url: string) => {
    await handleSendImageMessage(url);
    setShowStickerPicker(false);
  };

  const handleGiphySearch = async () => {
    const apiKey = import.meta.env.VITE_GIPHY_API_KEY;
    if (!apiKey || !gifQuery.trim()) return;

    setGifLoading(true);
    try {
      const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(gifQuery)}&limit=12&rating=g`);
      const json = await res.json();
      setGifResults((json.data || []).map((g: any) => ({
        id: g.id,
        url: g.images?.original?.url || g.images?.fixed_height?.url,
        preview: g.images?.fixed_height_downsampled?.url || g.images?.fixed_height?.url
      })));
    } catch (error) {
      console.error('Error searching Giphy:', error);
    } finally {
      setGifLoading(false);
    }
  };

  const handleSelectGif = async (url: string) => {
    await handleSendImageMessage(url);
    setShowGifPanel(false);
    setGifQuery('');
    setGifResults([]);
  };

  const handleInsertMention = (username: string) => {
    const mention = `@${username} `;
    const replaced = newComment.replace(/@[\w]*$/, mention);
    setNewComment(replaced);
    setShowTagDropdown(false);
    setTagQuery('');
    chatInputRef.current?.focus();
  };

  const handleSendGift = async (gift: Gift) => {
    if (!selectedStream || !user || isPractice) return;

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
        { user_id: user.id, amount: -gift.cost_coins, transaction_type: 'gift_sent', description: `Sent ${gift.name} to ${selectedStream.host_name}` },
        { user_id: selectedStream.host_id, amount: Math.floor(gift.cost_coins * 0.9), transaction_type: 'gift_received', description: `Received ${gift.name} from ${user.email?.split('@')[0]}` }
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
    if (!selectedStream || !user || isPractice) return;
    
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
    if (!user || !selectedStream || !targetUserId || targetUserId === user.id) return;
    
    try {
      const { data: existingMatch } = await supabase
        .from('stream_matches')
        .select('*')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${targetUserId}),and(user1_id.eq.${targetUserId},user2_id.eq.${user.id})`)
        .maybeSingle();
      
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
    if (!selectedStream || !user || isPractice) return;
    try {
      const { data, error } = await supabase.from('messages').insert({
        room_id: selectedStream.id,
        sender_id: user.id,
        content: '❤️',
        message_type: 'dating_interest'
      }).select().single();

      if (error) throw error;

      // Show the like in chat immediately
      if (data) handleNewComment(data);

      const heartElement = document.createElement('div');
      heartElement.className = 'fixed inset-0 pointer-events-none flex items-center justify-center z-50';
      heartElement.innerHTML = '<div class="text-7xl sm:text-9xl animate-ping">❤️</div>';
      document.body.appendChild(heartElement);
      setTimeout(() => heartElement.remove(), 1000);
    } catch (error) {
      console.error('Error sending like:', error);
    }
  };

  const handleStartPoll = async () => {
    if (!selectedStream || !user || !isHost || isPractice || !newPollQuestion.trim()) return;
    const validOptions = newPollOptions.map(o => o.trim()).filter(Boolean);
    if (validOptions.length < 2 || validOptions.length > 4) {
      toast({ title: 'Invalid Poll', description: 'A poll needs 2 to 4 options.', variant: 'destructive' });
      return;
    }

    const pollId = `poll-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    const payload = JSON.stringify({ id: pollId, question: newPollQuestion.trim(), options: validOptions });

    try {
      const { error } = await supabase.from('messages').insert({
        room_id: selectedStream.id,
        sender_id: user.id,
        content: `POLL|${payload}`,
        message_type: 'system'
      });

      if (error) throw error;

      setActivePoll({ id: pollId, question: newPollQuestion.trim(), options: validOptions });
      setPollVotes({ [pollId]: {} });
      setNewPollQuestion('');
      setNewPollOptions(['', '']);
      setShowPollCreator(false);

      toast({ title: 'Poll Started', description: 'Viewers can now vote on your poll.' });
    } catch (error) {
      console.error('Error starting poll:', error);
      toast({ title: 'Error', description: 'Failed to start poll.', variant: 'destructive' });
    }
  };

  const handleVote = async (optionIndex: number) => {
    if (!selectedStream || !user || !activePoll || isPractice) return;

    try {
      const { error } = await supabase.from('messages').insert({
        room_id: selectedStream.id,
        sender_id: user.id,
        content: `VOTE|${activePoll.id}|${optionIndex}`,
        message_type: 'system'
      });

      if (error) throw error;

      setPollVotes(prev => ({
        ...prev,
        [activePoll.id]: {
          ...(prev[activePoll.id] || {}),
          [optionIndex.toString()]: ((prev[activePoll.id]?.[optionIndex.toString()] || 0) + 1)
        }
      }));
    } catch (error) {
      console.error('Error voting:', error);
      toast({ title: 'Error', description: 'Failed to submit vote.', variant: 'destructive' });
    }
  };

  const handleEndPoll = async () => {
    if (!selectedStream || !user || !activePoll || !isHost || isPractice) return;

    try {
      const { error } = await supabase.from('messages').insert({
        room_id: selectedStream.id,
        sender_id: user.id,
        content: `POLL_END|${activePoll.id}`,
        message_type: 'system'
      });

      if (error) throw error;

      setActivePoll(null);
      toast({ title: 'Poll Ended', description: 'The poll has ended.' });
    } catch (error) {
      console.error('Error ending poll:', error);
      toast({ title: 'Error', description: 'Failed to end poll.', variant: 'destructive' });
    }
  };

  const handleAddBannedWord = () => {
    if (!newBannedWord.trim()) return;
    const word = newBannedWord.trim().toLowerCase();
    if (!bannedWords.includes(word)) {
      setBannedWords([...bannedWords, word]);
    }
    setNewBannedWord('');
  };

  const handleRemoveBannedWord = (word: string) => {
    setBannedWords(bannedWords.filter(w => w !== word));
  };

  const handleShare = () => {
    if (isPractice) return;
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

  const formatTime = (date: Date | string | undefined | null) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '';
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

  const renderMentionedText = (text: string) => {
    const parts = text.split(/(@\S+)/g);
    return (
      <>
        {parts.map((part, i) =>
          part.startsWith('@') ? (
            <span key={i} className="text-rose-400 dark:text-purple-400 font-semibold">
              {part}
            </span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  };

  const handleToggleVideo = () => {
    if (!localStream) return;
    const videoTracks = localStream.getVideoTracks();
    const newVideoOff = !isVideoOff;
    videoTracks.forEach(track => (track.enabled = !newVideoOff));
    setIsVideoOff(newVideoOff);
  };

  const handleToggleAudio = () => {
    if (!localStream) return;
    const audioTracks = localStream.getAudioTracks();
    const newMuted = !isMuted;
    audioTracks.forEach(track => (track.enabled = !newMuted));
    setIsMuted(newMuted);
  };

  const filteredStreams = selectedCategory === 'all' 
    ? liveStreams 
    : liveStreams.filter(s => s.category === selectedCategory);

  if (!user) return null;

  // Live Stream Player View (Mobile-First)
  if (selectedStream) {
    const lowerMessage = (msg: string) => msg?.toLowerCase() || '';
    const visibleComments = comments.filter(
      c => !bannedWords.some(w => lowerMessage(c.message).includes(w.toLowerCase()))
    );

    return (
      <AuthGuard>
        <div className="h-screen w-full bg-black relative overflow-hidden flex flex-col lg:flex-row">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageUpload}
            className="hidden"
          />
          {/* Moderation Panel */}
          <AnimatePresence>
            {showModeration && isHost && !isPractice && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="absolute top-16 right-3 z-40 w-72 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    Chat Filters
                  </h3>
                  <button onClick={() => setShowModeration(false)} className="text-white/50 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3 max-h-24 overflow-y-auto">
                  {bannedWords.map(word => (
                    <span
                      key={word}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-rose-500/20 text-rose-200 text-[10px] border border-rose-500/30"
                    >
                      {word}
                      <button onClick={() => handleRemoveBannedWord(word)} className="hover:text-white">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    value={newBannedWord}
                    onChange={(e) => setNewBannedWord(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddBannedWord()}
                    placeholder="Add word..."
                    className="flex-1 bg-white/10 text-white placeholder-white/40 border-white/10 text-xs h-9"
                  />
                  <Button onClick={handleAddBannedWord} size="sm" className="h-9 px-3 bg-emerald-600 hover:bg-emerald-700 text-white">
                    Add
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Multi-Guest Panel */}
          <AnimatePresence>
            {showMultiGuest && isHost && !isPractice && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="absolute top-16 right-3 z-50 w-80 max-h-[80vh] bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col overflow-hidden"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-rose-400" />
                    Multi-Guest ({guests.length}/5)
                  </h3>
                  <div className="flex items-center gap-1">
                    {guests.length > 0 && (
                      <Button
                        onClick={handleClearGuests}
                        variant="ghost"
                        size="sm"
                        className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-8 px-2 text-xs"
                      >
                        Clear
                      </Button>
                    )}
                    <Button
                      onClick={() => setShowMultiGuest(false)}
                      variant="ghost"
                      size="icon"
                      className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                  {participants
                    .filter(p => !p.is_host && p.user_id !== user?.id)
                    .map(p => {
                      const isSelected = guests.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors"
                        >
                          <ParticipantAvatar participant={p} size="md" />
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{p.user_name}</p>
                          </div>
                          <Button
                            onClick={() => handleToggleGuest(p.id)}
                            size="icon"
                            className={cn(
                              "h-8 w-8 rounded-full",
                              isSelected
                                ? "bg-rose-500 hover:bg-rose-600 text-white"
                                : "bg-white/10 hover:bg-white/20 text-white"
                            )}
                            disabled={!isSelected && guests.length >= 5}
                          >
                            {isSelected ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                          </Button>
                        </div>
                      );
                    })}
                  {participants.filter(p => !p.is_host && p.user_id !== user?.id).length === 0 && (
                    <p className="text-white/40 text-sm text-center py-8">No participants available</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Video Container */}
          <div
            ref={videoContainerRef}
            className="relative w-full h-full lg:h-auto lg:flex-1 bg-black"
          >
            {/* Video Player */}
            <div className="absolute inset-0">
              {guests.length > 0 ? (
                <div className="w-full h-full flex flex-col lg:flex-row gap-2 p-2 bg-black">
                  <div className="relative flex-1 min-h-0 rounded-xl overflow-hidden bg-slate-900">
                    {isHost && localStream ? (
                      <video
                        ref={(el) => setVideoRef(el)}
                        autoPlay
                        playsInline
                        muted={isMuted}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <LiveThumbnail
                        stream={selectedStream}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute bottom-2 left-2 px-2 py-1 rounded-full bg-black/60 text-white text-[10px]">
                      {isHost ? 'You (Host)' : selectedStream.host_name}
                    </div>
                  </div>
                  <div className="w-full h-28 lg:w-64 lg:h-full overflow-x-auto lg:overflow-y-auto flex flex-row lg:flex-col gap-2 p-2 rounded-xl bg-slate-950/80 border border-white/10">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const selectedId = guests[i];
                      const guest = selectedId ? participants.find(p => p.id === selectedId) : undefined;
                      const guestId = guest?.id;
                      const handleRemove = guestId ? () => setGuests(prev => prev.filter(id => id !== guestId)) : undefined;
                      return (
                        <GuestSlot
                          key={i}
                          guest={guest}
                          onRemove={handleRemove}
                        />
                      );
                    })}
                  </div>
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent pointer-events-none" />

            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-3 sm:p-4 flex items-center justify-between z-20 bg-gradient-to-b from-black/70 via-black/20 to-transparent">
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleLeaveStream}
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 rounded-full w-9 h-9 p-0"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="w-10 h-10 ring-2 ring-white/30">
                      <AvatarImage src={selectedStream.host_avatar} />
                      <AvatarFallback className="text-sm bg-gradient-to-br from-rose-500 to-purple-600 text-white">{selectedStream.host_name[0]}</AvatarFallback>
                    </Avatar>
                    {selectedStream.host_verified && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-black flex items-center justify-center">
                        <Shield className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-white text-sm font-semibold">{selectedStream.host_name}</h2>
                    <p className="text-white/70 text-xs line-clamp-1 max-w-[140px] sm:max-w-[240px]">{selectedStream.title}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                  <Eye className="w-3.5 h-3.5 text-white" />
                  <span className="text-white text-xs font-semibold">{viewerCount.toLocaleString()}</span>
                </div>
                {isPractice ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-indigo-600 shadow-lg shadow-indigo-600/20">
                    <span className="w-1.5 h-1.5 bg-white rounded-full" />
                    <span className="text-white text-xs font-bold tracking-wide">Practice Mode</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-rose-600 shadow-lg shadow-rose-600/20">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    <span className="text-white text-xs font-bold tracking-wide">LIVE</span>
                  </div>
                )}
                {isHost && (
                  <Button
                    onClick={handleCopyInviteLink}
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 rounded-full w-9 h-9 p-0"
                    title="Copy invite link"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  onClick={toggleFullscreen}
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 rounded-full w-9 h-9 p-0"
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

            {/* Right Side Action Buttons (TikTok Style) */}
            <div className="absolute right-3 bottom-24 sm:bottom-28 flex flex-col items-center gap-4 z-20">
              {!isHost && (
                <>
                  <button
                    onClick={handleLike}
                    className="flex flex-col items-center gap-1 group"
                  >
                    <div className="w-12 h-12 rounded-full bg-rose-500/90 backdrop-blur-md shadow-lg shadow-rose-500/30 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                      <Heart className="w-6 h-6 fill-current" />
                    </div>
                    <span className="text-white text-[10px] font-medium drop-shadow-md">
                      {comments.filter(c => c.is_dating_interest).length > 0
                        ? comments.filter(c => c.is_dating_interest).length
                        : 'Like'}
                    </span>
                  </button>

                  <button
                    onClick={() => setShowGiftMenu(true)}
                    className="flex flex-col items-center gap-1 group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-rose-500 to-purple-600 shadow-xl shadow-rose-500/30 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                      <Gift className="w-7 h-7" />
                    </div>
                    <span className="text-white text-[10px] font-medium drop-shadow-md">Gift</span>
                  </button>

                  <button
                    onClick={handleDatingInterest}
                    className="flex flex-col items-center gap-1 group"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 shadow-lg shadow-pink-500/30 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <span className="text-white text-[10px] font-medium drop-shadow-md">Match</span>
                  </button>
                </>
              )}

              <button
                onClick={() => setIsChatVisible(!isChatVisible)}
                className="flex flex-col items-center gap-1 group lg:hidden"
              >
                <div className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <span className="text-white text-[10px] font-medium drop-shadow-md">Chat</span>
              </button>

              <button
                onClick={handleShare}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <Share2 className="w-6 h-6" />
                </div>
                <span className="text-white text-[10px] font-medium drop-shadow-md">Share</span>
              </button>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
              <div className="flex items-center justify-between gap-3">
                {isHost ? (
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleToggleVideo}
                      variant="ghost"
                      size="icon"
                      className={cn("w-11 h-11 rounded-full text-white", isVideoOff ? 'bg-rose-600' : 'bg-white/15 border border-white/20')}
                    >
                      {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                    </Button>
                    <Button
                      onClick={handleToggleAudio}
                      variant="ghost"
                      size="icon"
                      className={cn("w-11 h-11 rounded-full text-white", isMuted ? 'bg-rose-600' : 'bg-white/15 border border-white/20')}
                    >
                      {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </Button>
                    <Button
                      onClick={() => setShowParticipants(true)}
                      variant="ghost"
                      size="icon"
                      className="w-11 h-11 rounded-full bg-white/15 border border-white/20 text-white"
                    >
                      <Users className="w-5 h-5" />
                    </Button>
                    {!isPractice && (
                      <Button
                        onClick={() => setShowMultiGuest(true)}
                        variant="ghost"
                        size="sm"
                        className="h-11 px-4 rounded-full bg-white/15 border border-white/20 text-white text-xs font-medium"
                      >
                        <Users className="w-4 h-4 mr-1.5" />
                        Multi-Guest
                      </Button>
                    )}
                    {!isPractice && (
                      <Button
                        onClick={() => setShowPollCreator(true)}
                        variant="ghost"
                        size="sm"
                        className="h-11 px-4 rounded-full bg-white/15 border border-white/20 text-white text-xs font-medium"
                      >
                        <BarChart3 className="w-4 h-4 mr-1.5" />
                        Poll
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setShowIcebreakers(true)}
                      variant="ghost"
                      size="sm"
                      className="h-11 px-4 rounded-full bg-white/15 border border-white/20 text-white text-xs font-medium"
                    >
                      <MessageCircle className="w-4 h-4 mr-1.5" />
                      Icebreakers
                    </Button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {isHost && (
                    <>
                      {!isPractice && (
                        <Button
                          onClick={() => setShowModeration(!showModeration)}
                          className="h-11 px-5 rounded-full bg-slate-700 hover:bg-slate-600 text-white font-semibold text-sm shadow-lg"
                        >
                          <Shield className="w-4 h-4 mr-1.5" />
                          Moderation
                        </Button>
                      )}
                      <Button
                        onClick={handleStopLive}
                        className="h-11 px-6 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm shadow-lg shadow-rose-600/30"
                      >
                        End Stream
                      </Button>
                    </>
                  )}
                  {!isHost && (
                    <>
                      <Button
                        onClick={() => setShowGiftMenu(true)}
                        className="hidden sm:flex h-11 px-5 rounded-full bg-gradient-to-r from-rose-500 to-purple-600 text-white font-semibold text-sm shadow-lg shadow-rose-500/30"
                      >
                        <Gift className="w-4 h-4 mr-1.5" />
                        Send Gift
                      </Button>
                      <Button
                        onClick={() => setIsChatVisible(!isChatVisible)}
                        variant="ghost"
                        size="sm"
                        className="h-11 px-4 rounded-full bg-white/15 border border-white/20 text-white text-xs font-medium lg:hidden"
                      >
                        <MessageCircle className="w-4 h-4 mr-1.5" />
                        {visibleComments.length} Chat
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {isHost && !isPractice && (
            <PollCreator
              show={showPollCreator}
              onClose={() => setShowPollCreator(false)}
              question={newPollQuestion}
              setQuestion={setNewPollQuestion}
              options={newPollOptions}
              setOptions={setNewPollOptions}
              onStart={handleStartPoll}
            />
          )}

          {/* Desktop Side Chat Panel */}
          <div className="hidden lg:flex w-[380px] h-full bg-slate-950 border-l border-white/10 flex-col z-10">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-rose-500" />
                <h3 className="text-white font-semibold text-sm">Live Chat</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-white/60 text-xs">{viewerCount.toLocaleString()} watching</span>
              </div>
            </div>

            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-3"
            >
              {activePoll && (
                <ActivePollPanel
                  activePoll={activePoll}
                  pollVotes={pollVotes}
                  isHost={isHost}
                  onVote={handleVote}
                  onEndPoll={handleEndPoll}
                />
              )}
              {visibleComments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-2.5">
                  <Avatar className="w-7 h-7 flex-shrink-0">
                    <AvatarImage src={comment.user_avatar} />
                    <AvatarFallback className="text-xs bg-gradient-to-br from-rose-500 to-purple-600 text-white">{comment.user_name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-semibold text-xs">{comment.user_name}</span>
                      {comment.user_vip_tier && comment.user_vip_tier !== 'free' && (
                        <Crown className="w-3 h-3 text-amber-500" />
                      )}
                    </div>
                    {comment.is_image ? (
                      <img
                        src={comment.message}
                        alt="shared"
                        className="max-h-40 rounded-lg mt-1 object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <p className={cn(
                        "text-xs break-words mt-0.5",
                        comment.is_system ? 'text-purple-400' :
                        comment.is_gift ? 'text-amber-400' :
                        comment.is_dating_interest ? 'text-pink-400' : 'text-white/80'
                      )}>
                        {renderMentionedText(comment.message)}
                      </p>
                    )}
                  </div>
                  <span className="text-white/30 text-[10px] flex-shrink-0">{formatTime(comment.created_at)}</span>
                </div>
              ))}
              <div ref={commentsEndRef} />
            </div>

            <div className="p-3 border-t border-white/10 bg-slate-950">
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
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="ghost"
                  size="icon"
                  disabled={isUploading}
                  className="text-white/70 hover:text-white hover:bg-white/10 h-10 w-10 shrink-0"
                  title="Upload image"
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
                </Button>

                <Popover open={showStickerPicker} onOpenChange={setShowStickerPicker}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white/70 hover:text-white hover:bg-white/10 h-10 w-10 shrink-0"
                      title="Stickers"
                    >
                      <Smile className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent side="top" sideOffset={8} className="w-56 bg-slate-900 border-white/10 p-2">
                    <div className="grid grid-cols-4 gap-2">
                      {STICKERS.map((sticker) => (
                        <button
                          key={sticker.id}
                          onClick={() => handleSelectSticker(sticker.url)}
                          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
                          title={sticker.label}
                        >
                          <img src={sticker.url} alt={sticker.label} className="w-7 h-7" />
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                <Popover open={showGifPanel} onOpenChange={setShowGifPanel}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white/70 hover:text-white hover:bg-white/10 h-10 w-10 shrink-0"
                      title="GIF"
                    >
                      <Film className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent side="top" sideOffset={8} className="w-80 bg-slate-900 border-white/10 p-3">
                    {import.meta.env.VITE_GIPHY_API_KEY ? (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            value={gifQuery}
                            onChange={(e) => setGifQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleGiphySearch()}
                            placeholder="Search GIFs..."
                            className="flex-1 bg-white/10 text-white placeholder-white/40 border-white/10 text-sm h-9"
                          />
                          <Button onClick={handleGiphySearch} size="sm" className="h-9 px-3 bg-rose-600 text-white">
                            {gifLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Search'}
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                          {gifResults.map((gif) => (
                            <button
                              key={gif.id}
                              onClick={() => handleSelectGif(gif.url)}
                              className="relative aspect-square rounded-lg overflow-hidden hover:ring-2 ring-rose-500"
                            >
                              <img src={gif.preview} alt="gif" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-white/70 text-center py-4">
                        Add VITE_GIPHY_API_KEY to .env to enable GIF search.
                      </p>
                    )}
                  </PopoverContent>
                </Popover>

                <div className="flex-1 relative">
                  <Input
                    ref={chatInputRef}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendComment()}
                    placeholder="Say something nice..."
                    className="w-full bg-white/10 text-white placeholder-white/40 border-white/10 text-sm h-11"
                  />
                  {showTagDropdown && (
                    <div className="absolute bottom-full left-0 right-0 mb-1 bg-slate-900 border border-white/10 rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto">
                      {participants
                        .filter((p) => p.user_name.toLowerCase().includes(tagQuery.toLowerCase()))
                        .map((p) => (
                          <button
                            key={p.user_id}
                            onClick={() => handleInsertMention(p.user_name)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-white/90 hover:bg-white/10"
                          >
                            <Avatar className="w-6 h-6"><AvatarImage src={p.user_avatar} /><AvatarFallback className="text-[10px]">{p.user_name[0]}</AvatarFallback></Avatar>
                            <span>@{p.user_name}</span>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleSendComment}
                  size="icon"
                  className="bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white h-11 w-11 p-0 rounded-xl shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
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
                className="absolute bottom-0 left-0 right-0 h-2/3 bg-slate-950/95 backdrop-blur-xl rounded-t-3xl border-t border-white/10 flex flex-col z-20 lg:hidden"
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
                  {activePoll && (
                    <ActivePollPanel
                      activePoll={activePoll}
                      pollVotes={pollVotes}
                      isHost={isHost}
                      onVote={handleVote}
                      onEndPoll={handleEndPoll}
                    />
                  )}
                  {visibleComments.map((comment) => (
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
                        {comment.is_image ? (
                          <img
                            src={comment.message}
                            alt="shared"
                            className="max-h-40 rounded-lg mt-1 object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <p className={cn(
                            "text-sm break-words",
                            comment.is_system ? 'text-purple-400' : 
                            comment.is_gift ? 'text-amber-400' : 
                            comment.is_dating_interest ? 'text-pink-400' : 'text-white/90'
                          )}>
                            {renderMentionedText(comment.message)}
                          </p>
                        )}
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
                  <div className="flex items-center gap-1.5">
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="ghost"
                      size="icon"
                      disabled={isUploading}
                      className="text-white/70 hover:text-white hover:bg-white/10 h-9 w-9 shrink-0"
                      title="Upload image"
                    >
                      {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
                    </Button>

                    <Popover open={showStickerPicker} onOpenChange={setShowStickerPicker}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-white/70 hover:text-white hover:bg-white/10 h-9 w-9 shrink-0"
                          title="Stickers"
                        >
                          <Smile className="w-4 h-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent side="top" sideOffset={8} className="w-56 bg-slate-900 border-white/10 p-2">
                        <div className="grid grid-cols-4 gap-2">
                          {STICKERS.map((sticker) => (
                            <button
                              key={sticker.id}
                              onClick={() => handleSelectSticker(sticker.url)}
                              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
                              title={sticker.label}
                            >
                              <img src={sticker.url} alt={sticker.label} className="w-7 h-7" />
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>

                    <Popover open={showGifPanel} onOpenChange={setShowGifPanel}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-white/70 hover:text-white hover:bg-white/10 h-9 w-9 shrink-0"
                          title="GIF"
                        >
                          <Film className="w-4 h-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent side="top" sideOffset={8} className="w-72 bg-slate-900 border-white/10 p-3">
                        {import.meta.env.VITE_GIPHY_API_KEY ? (
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <Input
                                value={gifQuery}
                                onChange={(e) => setGifQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleGiphySearch()}
                                placeholder="Search GIFs..."
                                className="flex-1 bg-white/10 text-white placeholder-white/40 border-white/10 text-sm h-9"
                              />
                              <Button onClick={handleGiphySearch} size="sm" className="h-9 px-2 bg-rose-600 text-white text-xs">
                                {gifLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Go'}
                              </Button>
                            </div>
                            <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                              {gifResults.map((gif) => (
                                <button
                                  key={gif.id}
                                  onClick={() => handleSelectGif(gif.url)}
                                  className="relative aspect-square rounded-lg overflow-hidden hover:ring-2 ring-rose-500"
                                >
                                  <img src={gif.preview} alt="gif" className="w-full h-full object-cover" />
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-white/70 text-center py-4">
                            Add VITE_GIPHY_API_KEY to .env to enable GIF search.
                          </p>
                        )}
                      </PopoverContent>
                    </Popover>

                    <div className="flex-1 relative min-w-0">
                      <Input
                        ref={chatInputRef}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendComment()}
                        placeholder="Type a message..."
                        className="w-full bg-white/10 text-white placeholder-white/40 border-white/10 text-sm h-10"
                      />
                      {showTagDropdown && (
                        <div className="absolute bottom-full left-0 right-0 mb-1 bg-slate-900 border border-white/10 rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto">
                          {participants
                            .filter((p) => p.user_name.toLowerCase().includes(tagQuery.toLowerCase()))
                            .map((p) => (
                              <button
                                key={p.user_id}
                                onClick={() => handleInsertMention(p.user_name)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-white/90 hover:bg-white/10"
                              >
                                <Avatar className="w-6 h-6"><AvatarImage src={p.user_avatar} /><AvatarFallback className="text-[10px]">{p.user_name[0]}</AvatarFallback></Avatar>
                                <span>@{p.user_name}</span>
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={handleSendComment}
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700 text-white h-10 w-10 p-0 shrink-0"
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
                          {p.role === 'co-host' && <Crown className="w-3 h-3 text-purple-500" />}
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

                  {selectedParticipant.role !== 'viewer' && (
                    <div className="mb-4">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        selectedParticipant.role === 'host' ? 'bg-amber-500/20 text-amber-400' : 'bg-purple-500/20 text-purple-400'
                      )}>
                        {selectedParticipant.role === 'host' ? 'Host' : 'Co-host'}
                      </span>
                    </div>
                  )}

                  {selectedParticipant.relationship_intention && (
                    <div className="mb-4">
                      <p className="text-white/80 text-sm text-center">{selectedParticipant.relationship_intention}</p>
                    </div>
                  )}

                  {/* Host management actions */}
                  {isHost && selectedParticipant.user_id !== user.id && !selectedParticipant.is_host && (
                    <div className="space-y-2 mb-4">
                      <Button
                        onClick={() => handleToggleParticipantMute(selectedParticipant)}
                        variant="outline"
                        className="w-full border-white/10 text-white hover:bg-white/10"
                      >
                        {selectedParticipant.is_muted ? <Mic className="w-4 h-4 mr-2" /> : <MicOff className="w-4 h-4 mr-2" />}
                        {selectedParticipant.is_muted ? 'Unmute' : 'Mute'}
                      </Button>

                      <Button
                        onClick={() => handlePromoteToCoHost(selectedParticipant)}
                        variant="outline"
                        className="w-full border-white/10 text-white hover:bg-white/10"
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        Make Co-host
                      </Button>

                      <Button
                        onClick={() => handleKickParticipant(selectedParticipant)}
                        variant="outline"
                        className="w-full border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Remove from Stream
                      </Button>
                    </div>
                  )}

                  {selectedParticipant.user_id !== user.id && !selectedParticipant.is_host && !isHost && (
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
        <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/90 backdrop-blur-2xl border-b border-rose-100 dark:border-rose-900/20">
          <div className="px-4 py-3 sm:py-4 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => navigate('/dashboard')}
                  variant="ghost"
                  size="icon"
                  className="lg:hidden rounded-full text-slate-700 dark:text-slate-300"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
                    Live
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Discover & connect in real-time
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setShowGoLive(true)}
                  className="bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white text-sm font-semibold h-10 px-4 rounded-full shadow-lg shadow-rose-500/25"
                >
                  <Video className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Go Live</span>
                </Button>
                <Button
                  onClick={handleStartPractice}
                  className="bg-slate-600 hover:bg-slate-700 text-white text-sm font-semibold h-10 px-4 rounded-full shadow-lg"
                >
                  <Camera className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Practice Mode</span>
                </Button>
                <Button
                  onClick={() => setShowMobileMenu(true)}
                  variant="ghost"
                  size="icon"
                  className="lg:hidden rounded-full text-slate-700 dark:text-slate-300"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto mt-4 pb-1 scrollbar-hide">
              {categories.map((category) => (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  className={cn(
                    "whitespace-nowrap flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-all",
                    selectedCategory === category.value
                      ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-md shadow-rose-500/20'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-700'
                  )}
                >
                  {category.icon}
                  <span className="hidden xs:inline">{category.label}</span>
                </button>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredStreams.map((stream, index) => (
                <motion.div
                  key={stream.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  onClick={() => handleJoinStream(stream)}
                  className="group cursor-pointer"
                >
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden bg-white dark:bg-slate-900 rounded-2xl">
                    {/* Thumbnail */}
                    <div className="relative aspect-[4/5]">
                      <LiveThumbnail
                        stream={stream}
                        className="absolute inset-0 w-full h-full rounded-2xl"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-2xl" />

                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <Badge className="bg-black/40 backdrop-blur-md text-white border-white/20 text-[10px] px-2 py-0.5 h-5">
                          {getRoomTypeIcon(stream.room_type)}
                        </Badge>
                      </div>

                      <div className="absolute bottom-3 left-3 right-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-9 h-9 border-2 border-white/20">
                            <AvatarImage src={stream.host_avatar} />
                            <AvatarFallback className="text-xs bg-gradient-to-br from-rose-500 to-purple-600 text-white">{stream.host_name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-semibold text-sm drop-shadow-md line-clamp-1">{stream.title}</h3>
                            <div className="flex items-center gap-1.5 text-white/90 text-xs">
                              <span className="drop-shadow-sm">{stream.host_name}</span>
                              {stream.host_verified && (
                                <Shield className="w-3 h-3 text-emerald-400 fill-emerald-500" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stream Info */}
                    <CardContent className="p-3.5">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className="text-[10px] bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-0 font-medium">
                          {stream.category}
                        </Badge>
                        <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
                          <Clock className="w-3 h-3" />
                          {formatDuration(Math.floor((Date.now() - new Date(stream.started_at).getTime()) / 1000))}
                        </div>
                      </div>

                      {(stream.city || stream.country) && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-3">
                          <MapPin className="w-3 h-3" />
                          <span>{getCountryFlag(stream.country)} {stream.city || stream.country}</span>
                        </div>
                      )}

                      <Button className="w-full h-9 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white text-sm font-semibold shadow-md shadow-rose-500/20">
                        Join Live
                      </Button>
                    </CardContent>
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