import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Heart, MessageCircle, Users, Eye, Star, TrendingUp, Calendar,
  MapPin, Gift, Crown, Shield, Activity, Clock, ChevronRight,
  Bell, Settings, Search, User, Sparkles, Zap, Loader2,
  Coffee, Video, Wallet, Compass, X, Menu, Home,
  Award, Briefcase, Book, Music, Camera, Globe,
  ChevronLeft, Filter, Download, Upload, Lock,
  CheckCircle, AlertCircle, Info, Phone, Mail,
  Instagram, Twitter, Facebook, Linkedin,
  Moon, Sun, Monitor, LogOut, HelpCircle,
  ChevronDown, ChevronUp, MoreVertical, Share2,
  Flag, ThumbsUp, ThumbsDown, Smile, Frown,
  Cloud, CloudRain, CloudSnow, CloudLightning,
  Wind, Thermometer, Droplets, Sunrise, Sunset
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Types
interface DashboardStats {
  totalMatches: number;
  newMessages: number;
  profileViews: number;
  giftsReceived: number;
  giftsSent: number;
  weeklyActive: number;
  monthlyGrowth: number;
  profileStrength: number;
  coinsBalance: number;
  subscriptionTier: 'free' | 'premium' | 'vip';
  subscriptionExpiry?: Date;
  dailyLikes: number;
  dailyLikesLimit: number;
  responseRate: number;
  averageResponseTime: number;
}

interface RecentActivity {
  id: string;
  type: 'match' | 'message' | 'like' | 'gift' | 'view' | 'subscription' | 'system';
  userId: string;
  userName: string;
  userAvatar: string;
  userAge?: number;
  userVerified: boolean;
  userVipTier?: string;
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  read: boolean;
  actionable: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

interface MatchSuggestion {
  id: string;
  name: string;
  age: number;
  location: string;
  city: string;
  country: string;
  avatar: string;
  matchPercentage: number;
  interests: string[];
  verified: boolean;
  vipTier: string;
  online: boolean;
  lastActive: Date;
  distance?: number;
  compatibility: {
    personality: number;
    interests: number;
    values: number;
    lifestyle: number;
  };
  photos: string[];
  bio?: string;
  relationshipGoals?: string;
  height?: number;
  education?: string;
  profession?: string;
  languages?: string[];
  zodiac?: string;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  progress: number;
  target: number;
  completed: boolean;
  reward?: {
    type: 'coins' | 'badge' | 'feature';
    value: number | string;
  };
}

// Utility Functions
const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const getActivityIcon = (type: RecentActivity['type']) => {
  const icons = {
    match: <Heart className="w-4 h-4 text-rose-500" />,
    message: <MessageCircle className="w-4 h-4 text-blue-500" />,
    like: <ThumbsUp className="w-4 h-4 text-green-500" />,
    gift: <Gift className="w-4 h-4 text-amber-500" />,
    view: <Eye className="w-4 h-4 text-purple-500" />,
    subscription: <Crown className="w-4 h-4 text-yellow-500" />,
    system: <Info className="w-4 h-4 text-gray-500" />
  };
  return icons[type] || <Activity className="w-4 h-4 text-gray-500" />;
};

const getMatchPercentageColor = (percentage: number): string => {
  if (percentage >= 90) return 'from-emerald-500 to-green-500';
  if (percentage >= 80) return 'from-blue-500 to-cyan-500';
  if (percentage >= 70) return 'from-purple-500 to-pink-500';
  if (percentage >= 60) return 'from-amber-500 to-orange-500';
  return 'from-gray-500 to-slate-500';
};

const getZodiacSign = (date: Date): string => {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return '♈ Aries';
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return '♉ Taurus';
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return '♊ Gemini';
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return '♋ Cancer';
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return '♌ Leo';
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return '♍ Virgo';
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return '♎ Libra';
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return '♏ Scorpio';
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return '♐ Sagittarius';
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return '♑ Capricorn';
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return '♒ Aquarius';
  return '♓ Pisces';
};

// Components
const StatCard: React.FC<{
  label: string;
  value: number;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  color: 'rose' | 'purple' | 'blue' | 'emerald' | 'amber';
  onClick?: () => void;
}> = ({ label, value, icon, trend, trendLabel, color, onClick }) => {
  const colors = {
    rose: 'from-rose-500 to-pink-500',
    purple: 'from-purple-500 to-indigo-500',
    blue: 'from-blue-500 to-cyan-500',
    emerald: 'from-emerald-500 to-green-500',
    amber: 'from-amber-500 to-yellow-500'
  };

  const lightColors = {
    rose: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400',
    purple: 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400',
    blue: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-xl p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800",
        "hover:shadow-lg transition-all duration-300"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", lightColors[color])}>
          {icon}
        </div>
        {trend !== undefined && (
          <Badge className={cn(
            "text-xs font-medium",
            trend >= 0 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          )}>
            {trend >= 0 ? '+' : ''}{trend}%
          </Badge>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
          {formatNumber(value)}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
        {trendLabel && (
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{trendLabel}</p>
        )}
      </div>
    </motion.div>
  );
};

const ActivityItem: React.FC<{ activity: RecentActivity; onClick?: () => void }> = ({ activity, onClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors",
        !activity.read && "bg-gradient-to-r from-rose-50/50 to-purple-50/50 dark:from-rose-950/20 dark:to-purple-950/20"
      )}
    >
      <div className="flex-shrink-0">
        <Avatar className="w-10 h-10">
          <AvatarImage src={activity.userAvatar} />
          <AvatarFallback className="bg-gradient-to-r from-rose-500 to-purple-500 text-white">
            {activity.userName[0]}
          </AvatarFallback>
        </Avatar>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
            {activity.userName}
          </span>
          {activity.userVerified && (
            <Shield className="w-3 h-3 text-emerald-500" />
          )}
          {activity.userVipTier && activity.userVipTier !== 'free' && (
            <Crown className="w-3 h-3 text-amber-500" />
          )}
          <span className="text-xs text-gray-500 dark:text-gray-500 ml-auto">
            {formatTimeAgo(activity.createdAt)}
          </span>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
          {activity.content}
        </p>
        
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center",
            activity.type === 'match' ? 'bg-rose-100 dark:bg-rose-900/30' :
            activity.type === 'message' ? 'bg-blue-100 dark:bg-blue-900/30' :
            activity.type === 'gift' ? 'bg-amber-100 dark:bg-amber-900/30' :
            'bg-gray-100 dark:bg-gray-800'
          )}>
            {getActivityIcon(activity.type)}
          </div>
          
          {activity.actionable && (
            <Button
              size="sm"
              variant="ghost"
              className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 h-7 px-2"
              onClick={(e) => {
                e.stopPropagation();
                if (activity.actionUrl) window.location.href = activity.actionUrl;
              }}
            >
              {activity.actionLabel || 'View'}
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const MatchSuggestionCard: React.FC<{ suggestion: MatchSuggestion; onLike?: () => void; onPass?: () => void }> = ({ 
  suggestion, onLike, onPass 
}) => {
  const [imageError, setImageError] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-300"
    >
      {/* Header with Match Percentage */}
      <div className="relative h-32 bg-gradient-to-r from-rose-500 to-purple-600">
        {/* Match Percentage Badge */}
        <div className="absolute -bottom-8 right-4">
          <div className={cn(
            "w-16 h-16 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold text-lg shadow-xl",
            getMatchPercentageColor(suggestion.matchPercentage)
          )}>
            {suggestion.matchPercentage}%
          </div>
        </div>
        
        {/* Online Indicator */}
        {suggestion.online && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/90 backdrop-blur-sm text-white text-xs">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            Online
          </div>
        )}
      </div>

      {/* Avatar */}
      <div className="relative -mt-8 ml-4">
        <Avatar className="w-16 h-16 ring-4 ring-white dark:ring-gray-900">
          <AvatarImage 
            src={!imageError ? suggestion.avatar : undefined} 
            onError={() => setImageError(true)}
          />
          <AvatarFallback className="bg-gradient-to-r from-rose-500 to-purple-500 text-white text-xl">
            {suggestion.name[0]}
          </AvatarFallback>
        </Avatar>
        
        {/* Verified Badge */}
        {suggestion.verified && (
          <div className="absolute -bottom-1 -right-1">
            <Badge className="w-5 h-5 p-0 bg-emerald-500 border-2 border-white dark:border-gray-900 rounded-full">
              <Shield className="w-3 h-3 text-white" />
            </Badge>
          </div>
        )}
        
        {/* VIP Badge */}
        {suggestion.vipTier !== 'free' && (
          <div className="absolute -top-1 left-12">
            <Badge className={cn(
              "px-1.5 py-0.5 text-[10px] border-0 text-white",
              suggestion.vipTier === 'vip' ? 'bg-gradient-to-r from-amber-500 to-yellow-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'
            )}>
              {suggestion.vipTier === 'vip' ? <Crown className="w-2 h-2 mr-0.5" /> : <Star className="w-2 h-2 mr-0.5" />}
              {suggestion.vipTier}
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 pt-2">
        <div className="mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
            {suggestion.name}, {suggestion.age}
          </h3>
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{suggestion.location}</span>
            {suggestion.distance && (
              <>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <span>{suggestion.distance} km away</span>
              </>
            )}
          </div>
        </div>

        {/* Bio */}
        {suggestion.bio && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
            {suggestion.bio}
          </p>
        )}

        {/* Compatibility Bars */}
        <div className="space-y-2 mb-3">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-600 dark:text-gray-400">Personality</span>
              <span className="font-medium text-rose-500">{suggestion.compatibility.personality}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full"
                style={{ width: `${suggestion.compatibility.personality}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-600 dark:text-gray-400">Interests</span>
              <span className="font-medium text-purple-500">{suggestion.compatibility.interests}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                style={{ width: `${suggestion.compatibility.interests}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-600 dark:text-gray-400">Values</span>
              <span className="font-medium text-blue-500">{suggestion.compatibility.values}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                style={{ width: `${suggestion.compatibility.values}%` }}
              />
            </div>
          </div>
        </div>

        {/* Interests */}
        <div className="flex flex-wrap gap-1 mb-3">
          {suggestion.interests.slice(0, 3).map((interest, i) => (
            <Badge key={i} className="bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-0 text-xs">
              {interest}
            </Badge>
          ))}
          {suggestion.interests.length > 3 && (
            <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-0 text-xs">
              +{suggestion.interests.length - 3}
            </Badge>
          )}
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
          {suggestion.relationshipGoals && (
            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
              <Heart className="w-3 h-3" />
              <span className="truncate">{suggestion.relationshipGoals}</span>
            </div>
          )}
          {suggestion.zodiac && (
            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
              <Star className="w-3 h-3" />
              <span>{suggestion.zodiac}</span>
            </div>
          )}
          {suggestion.profession && (
            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 col-span-2">
              <Briefcase className="w-3 h-3" />
              <span className="truncate">{suggestion.profession}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            onClick={onLike}
            className="flex-1 bg-gradient-to-r from-rose-500 to-purple-500 text-white hover:from-rose-600 hover:to-purple-600"
            size="sm"
          >
            <Heart className="w-4 h-4 mr-2" />
            Like
          </Button>
          <Button
            onClick={onPass}
            variant="outline"
            size="sm"
            className="flex-1 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
          >
            <X className="w-4 h-4 mr-2" />
            Pass
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="px-2">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/profile/${suggestion.id}`)}>
                <User className="w-4 h-4 mr-2" />
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {/* Report */}}>
                <Flag className="w-4 h-4 mr-2" />
                Report
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {/* Block */}}>
                <X className="w-4 h-4 mr-2" />
                Block
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  );
};

const AchievementCard: React.FC<{ achievement: Achievement }> = ({ achievement }) => {
  return (
    <div className={cn(
      "p-3 rounded-lg border transition-all",
      achievement.completed 
        ? "bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-200 dark:border-amber-800" 
        : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
          achievement.completed ? "bg-amber-500" : "bg-gray-300 dark:bg-gray-600"
        )}>
          {achievement.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
            {achievement.title}
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            {achievement.description}
          </p>
          <div className="flex items-center gap-2">
            <Progress 
              value={(achievement.progress / achievement.target) * 100} 
              className={cn(
                "h-1.5 flex-1",
                achievement.completed ? "bg-amber-200 dark:bg-amber-900" : "bg-gray-200 dark:bg-gray-700"
              )}
            />
            <span className="text-xs text-gray-500 dark:text-gray-500 whitespace-nowrap">
              {achievement.progress}/{achievement.target}
            </span>
          </div>
          {achievement.completed && achievement.reward && (
            <Badge className="mt-2 bg-amber-500 text-white border-0 text-xs">
              Reward: {achievement.reward.type === 'coins' ? `${achievement.reward.value} Coins` : achievement.reward.value}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Component
const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showWelcome, setShowWelcome] = useState(true);
  
  // Data States
  const [stats, setStats] = useState<DashboardStats>({
    totalMatches: 0,
    newMessages: 0,
    profileViews: 0,
    giftsReceived: 0,
    giftsSent: 0,
    weeklyActive: 0,
    monthlyGrowth: 0,
    profileStrength: 0,
    coinsBalance: 0,
    subscriptionTier: 'free',
    dailyLikes: 0,
    dailyLikesLimit: 10,
    responseRate: 0,
    averageResponseTime: 0
  });
  
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [matchSuggestions, setMatchSuggestions] = useState<MatchSuggestion[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadUserProfile(),
        loadStats(),
        loadRecentActivity(),
        loadMatchSuggestions(),
        loadNotifications(),
        loadAchievements()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  // Load Data
  useEffect(() => {
    if (user) {
      loadDashboardData();
      setupRealtimeSubscriptions();

      // Check if first visit today
      const lastVisit = localStorage.getItem('lastDashboardVisit');
      const today = new Date().toDateString();
      if (lastVisit !== today) {
        setShowWelcome(true);
        localStorage.setItem('lastDashboardVisit', today);
      }
    }

    return () => {
      // Cleanup subscriptions
    };
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profile) {
      setUserProfile(profile);
      
      // Calculate profile strength
      const strength = calculateProfileStrength(profile);
      
      setStats(prev => ({
        ...prev,
        coinsBalance: profile.coins_balance || 0,
        subscriptionTier: profile.vip_tier || 'free',
        profileStrength: strength
      }));
    }
  };

  const loadStats = async () => {
    if (!user) return;
    
    try {
      // Get matches count
      const { count: matchesCount } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq('status', 'matched');

      // Get unread messages
      const { count: messagesCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('read', false);

      // Get gifts received
      const { count: giftsReceived } = await supabase
        .from('sent_gifts')
        .select('*', { count: 'exact', head: true })
        .eq('to_user_id', user.id);

      // Get gifts sent
      const { count: giftsSent } = await supabase
        .from('sent_gifts')
        .select('*', { count: 'exact', head: true })
        .eq('from_user_id', user.id);

      // Get today's likes
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: dailyLikes } = await supabase
        .from('swipe_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('action', 'like')
        .gte('created_at', today.toISOString());

      setStats(prev => ({
        ...prev,
        totalMatches: matchesCount || 0,
        newMessages: messagesCount || 0,
        giftsReceived: giftsReceived || 0,
        giftsSent: giftsSent || 0,
        dailyLikes: dailyLikes || 0
      }));
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadRecentActivity = async () => {
    if (!user) return;
    
    const activities: RecentActivity[] = [];
    
    try {
      // Get recent matches
      const { data: matches } = await supabase
        .from('matches')
        .select(`
          id,
          created_at,
          user1:user1_id (
            username,
            full_name,
            avatar_url,
            age,
            is_verified,
            vip_tier
          ),
          user2:user2_id (
            username,
            full_name,
            avatar_url,
            age,
            is_verified,
            vip_tier
          )
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq('status', 'matched')
        .order('created_at', { ascending: false })
        .limit(5);

      if (matches) {
        matches.forEach(match => {
          const matchedUser = match.user1_id === user.id ? match.user2 : match.user1;
          activities.push({
            id: `match-${match.id}`,
            type: 'match',
            userId: matchedUser.id,
            userName: matchedUser.full_name || matchedUser.username || 'Anonymous',
            userAvatar: matchedUser.avatar_url || '',
            userAge: matchedUser.age,
            userVerified: matchedUser.is_verified || false,
            userVipTier: matchedUser.vip_tier,
            content: `You matched with ${matchedUser.full_name || matchedUser.username}!`,
            metadata: { matchId: match.id },
            createdAt: new Date(match.created_at),
            read: false,
            actionable: true,
            actionUrl: `/chat/${matchedUser.id}?newMatch=true`,
            actionLabel: 'Say Hi'
          });
        });
      }

      // Get recent messages
      const { data: messages } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          read,
          sender:sender_id (
            username,
            full_name,
            avatar_url,
            age,
            is_verified,
            vip_tier
          )
        `)
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (messages) {
        messages.forEach(msg => {
          activities.push({
            id: `msg-${msg.id}`,
            type: 'message',
            userId: msg.sender_id,
            userName: msg.sender?.full_name || msg.sender?.username || 'Anonymous',
            userAvatar: msg.sender?.avatar_url || '',
            userAge: msg.sender?.age,
            userVerified: msg.sender?.is_verified || false,
            userVipTier: msg.sender?.vip_tier,
            content: msg.content.substring(0, 100) + (msg.content.length > 100 ? '...' : ''),
            metadata: { messageId: msg.id },
            createdAt: new Date(msg.created_at),
            read: msg.read,
            actionable: true,
            actionUrl: `/chat/${msg.sender_id}`,
            actionLabel: 'Reply'
          });
        });
      }

      // Sort by date
      activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setRecentActivity(activities.slice(0, 10));
      
      // Count unread
      setUnreadCount(activities.filter(a => !a.read).length);
      
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  };

  const loadMatchSuggestions = async () => {
    if (!user) return;
    
    try {
      // Get current user's profile
      const { data: currentUser } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // Get swiped profiles
      const { data: swiped } = await supabase
        .from('swipe_history')
        .select('profile_id')
        .eq('user_id', user.id);

      const swipedIds = swiped?.map(s => s.profile_id) || [];

      // Get potential matches
      let query = supabase
        .from('profiles')
        .select(`
          *,
          photos:profile_photos(*)
        `)
        .neq('id', user.id)
        .limit(6);

      if (swipedIds.length > 0) {
        query = query.not('id', 'in', `(${swipedIds.join(',')})`);
      }

      const { data: profiles } = await query;

      if (profiles) {
        const suggestions: MatchSuggestion[] = profiles.map(profile => {
          const compatibility = calculateCompatibility(currentUser, profile);
          
          return {
            id: profile.id,
            name: profile.full_name || profile.username || 'Anonymous',
            age: profile.age || 25,
            location: `${profile.city || ''}${profile.city && profile.country ? ', ' : ''}${profile.country || ''}` || 'Location unknown',
            city: profile.city || '',
            country: profile.country || '',
            avatar: profile.avatar_url || '',
            matchPercentage: compatibility.overall,
            interests: profile.interests || [],
            verified: profile.is_verified || false,
            vipTier: profile.vip_tier || 'free',
            online: profile.last_active ? isUserOnline(profile.last_active) : false,
            lastActive: profile.last_active ? new Date(profile.last_active) : new Date(),
            distance: profile.city ? Math.floor(Math.random() * 20) + 1 : undefined, // Calculate actual distance
            compatibility: {
              personality: compatibility.personality,
              interests: compatibility.interests,
              values: compatibility.values,
              lifestyle: compatibility.lifestyle
            },
            photos: profile.photos?.map((p: { url: string }) => p.url) || [],
            bio: profile.bio,
            relationshipGoals: profile.relationship_goals,
            height: profile.height,
            education: profile.education,
            profession: profile.profession,
            languages: profile.languages,
            zodiac: profile.birthday ? getZodiacSign(new Date(profile.birthday)) : undefined
          };
        });

        // Sort by match percentage
        suggestions.sort((a, b) => b.matchPercentage - a.matchPercentage);
        setMatchSuggestions(suggestions);
      }
    } catch (error) {
      console.error('Error loading match suggestions:', error);
    }
  };

  const loadNotifications = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const formatted: Notification[] = (data || []).map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        read: n.read,
        createdAt: new Date(n.created_at),
        actionUrl: n.action_url
      }));

      setNotifications(formatted);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadAchievements = async () => {
    // Sample achievements - replace with actual data
    setAchievements([
      {
        id: '1',
        title: 'Social Butterfly',
        description: 'Send 100 messages',
        icon: <MessageCircle className="w-4 h-4 text-white" />,
        progress: 45,
        target: 100,
        completed: false,
        reward: { type: 'coins', value: 500 }
      },
      {
        id: '2',
        title: 'Match Maker',
        description: 'Get 10 matches',
        icon: <Heart className="w-4 h-4 text-white" />,
        progress: 7,
        target: 10,
        completed: false,
        reward: { type: 'badge', value: 'Match Maker' }
      },
      {
        id: '3',
        title: 'Gift Giver',
        description: 'Send 5 gifts',
        icon: <Gift className="w-4 h-4 text-white" />,
        progress: 5,
        target: 5,
        completed: true,
        reward: { type: 'coins', value: 200 }
      }
    ]);
  };

  const setupRealtimeSubscriptions = () => {
    // Implement realtime subscriptions for messages, matches, etc.
  };

  // Helper Functions
  const calculateProfileStrength = (profile: Record<string, unknown>): number => {
    let score = 0;
    const weights = {
      full_name: 10,
      bio: 15,
      avatar: 15,
      photos: 15,
      interests: 10,
      age: 5,
      location: 10,
      verified: 10,
      preferences: 5,
      social_links: 5
    };

    if (profile.full_name) score += weights.full_name;
    if (profile.bio && typeof profile.bio === 'string' && profile.bio.length > 50) score += weights.bio;
    else if (profile.bio) score += weights.bio / 2;

    if (profile.avatar_url) score += weights.avatar;

    const photoCount = Array.isArray(profile.photos) ? profile.photos.length : 0;
    score += Math.min(photoCount * 5, weights.photos);

    const interestCount = Array.isArray(profile.interests) ? profile.interests.length : 0;
    score += Math.min(interestCount * 2, weights.interests);

    if (profile.age) score += weights.age;
    if (profile.city && profile.country) score += weights.location;
    else if (profile.city || profile.country) score += weights.location / 2;

    if (profile.is_verified) score += weights.verified;
    if (profile.dating_preferences) score += weights.preferences;
    if (profile.social_links) score += weights.social_links;

    return Math.min(Math.round((score / 100) * 100), 100);
  };

  const calculateCompatibility = (user1: Record<string, unknown>, user2: Record<string, unknown>) => {
    // This is a simplified example - implement actual compatibility algorithm
    const personality = Math.floor(Math.random() * 30) + 70;
    const interests = Math.floor(Math.random() * 30) + 70;
    const values = Math.floor(Math.random() * 30) + 70;
    const lifestyle = Math.floor(Math.random() * 30) + 70;

    const overall = Math.floor((personality + interests + values + lifestyle) / 4);

    return { personality, interests, values, lifestyle, overall };
  };

  const isUserOnline = (lastActive: string): boolean => {
    if (!lastActive) return false;
    const diff = Date.now() - new Date(lastActive).getTime();
    return diff < 5 * 60 * 1000; // 5 minutes
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
      
      setUnreadCount(0);
      toast({
        title: "Success",
        description: "All notifications marked as read"
      });
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const handleSwipe = async (profileId: string, action: 'like' | 'pass') => {
    if (!user) return;
    
    try {
      await supabase.from('swipe_history').insert({
        user_id: user.id,
        profile_id: profileId,
        action: action
      });
      
      // Remove from suggestions
      setMatchSuggestions(prev => prev.filter(s => s.id !== profileId));
      
      if (action === 'like') {
        setStats(prev => ({ ...prev, dailyLikes: prev.dailyLikes + 1 }));
        
        // Check if it's a match (if the other user has already liked)
        const { data: otherSwipe } = await supabase
          .from('swipe_history')
          .select('*')
          .eq('user_id', profileId)
          .eq('profile_id', user.id)
          .eq('action', 'like')
          .single();
        
        if (otherSwipe) {
          // Create match
          await supabase.from('matches').insert({
            user1_id: user.id,
            user2_id: profileId,
            status: 'matched'
          });
          
          toast({
            title: "It's a Match! 🎉",
            description: "You can now start chatting",
            action: (
              <Button onClick={() => navigate(`/chat/${profileId}`)} size="sm">
                Say Hi
              </Button>
            )
          });
        }
      }
    } catch (error) {
      console.error('Error recording swipe:', error);
    }
  };

  // Memoized Values
  const unreadNotifications = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const upcomingAchievements = useMemo(() => {
    return achievements.filter(a => !a.completed).slice(0, 3);
  }, [achievements]);

  const recentMatches = useMemo(() => {
    return recentActivity
      .filter(a => a.type === 'match')
      .slice(0, 3);
  }, [recentActivity]);

  if (!user) return null;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-950 dark:to-rose-950/20">
        {/* Welcome Modal */}
        <AnimatePresence>
          {showWelcome && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowWelcome(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center mb-4">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-rose-500 to-purple-500 flex items-center justify-center">
                    <Heart className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Welcome back!
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    You have {unreadCount} new updates since your last visit
                  </p>
                </div>
                
                <div className="space-y-3 mb-4">
                  {recentMatches.length > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-rose-50 dark:bg-rose-950/30 rounded-lg">
                      <Heart className="w-5 h-5 text-rose-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          New Matches
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          You have {recentMatches.length} new match{recentMatches.length > 1 ? 'es' : ''}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {stats.newMessages > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                      <MessageCircle className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Unread Messages
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          You have {stats.newMessages} unread message{stats.newMessages > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowWelcome(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Later
                  </Button>
                  <Button
                    onClick={() => {
                      setShowWelcome(false);
                      navigate('/discover');
                    }}
                    className="flex-1 bg-gradient-to-r from-rose-500 to-purple-500 text-white"
                  >
                    Start Matching
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Menu */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="right" className="w-64 p-0 bg-white dark:bg-gray-900">
            <SheetHeader className="p-4 border-b border-gray-200 dark:border-gray-800">
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <div className="p-4">
              <nav className="space-y-1">
                <Link to="/matching">
                  <Button variant="ghost" className="w-full justify-start">
                    <Heart className="w-4 h-4 mr-2" />
                    Matching
                  </Button>
                </Link>
                <Link to="/search">
                  <Button variant="ghost" className="w-full justify-start">
                    <Search className="w-4 h-4 mr-2" />
                    Discover
                  </Button>
                </Link>
                <Link to="/live">
                  <Button variant="ghost" className="w-full justify-start">
                    <Video className="w-4 h-4 mr-2" />
                    Live
                  </Button>
                </Link>
                <Link to="/gifts">
                  <Button variant="ghost" className="w-full justify-start">
                    <Gift className="w-4 h-4 mr-2" />
                    Gifts
                  </Button>
                </Link>
                <Link to="/wallet">
                  <Button variant="ghost" className="w-full justify-start">
                    <Wallet className="w-4 h-4 mr-2" />
                    Wallet
                  </Button>
                </Link>
                <div className="border-t border-gray-200 dark:border-gray-800 my-2 pt-2">
                  <Link to="/notifications">
                    <Button variant="ghost" className="w-full justify-start">
                      <Bell className="w-4 h-4 mr-2" />
                      Notifications
                      {unreadCount > 0 && (
                        <Badge className="ml-auto bg-rose-500 text-white">
                          {unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                  <Link to="/settings">
                    <Button variant="ghost" className="w-full justify-start">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Button>
                  </Link>
                  <Link to="/help">
                    <Button variant="ghost" className="w-full justify-start">
                      <HelpCircle className="w-4 h-4 mr-2" />
                      Help
                    </Button>
                  </Link>
                </div>
              </nav>
            </div>
          </SheetContent>
        </Sheet>

        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              {/* Left Section */}
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => navigate(-1)}
                  variant="ghost"
                  size="sm"
                  className="lg:hidden"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                >
                  <h1 className="text-xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
                    Dashboard
                  </h1>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Welcome back, {userProfile?.full_name || user?.email?.split('@')[0]}
                  </p>
                </motion.div>
              </div>

              {/* Right Section */}
              <div className="flex items-center gap-2">
                {/* Coins */}
                <Button
                  onClick={() => navigate('/wallet')}
                  variant="outline"
                  size="sm"
                  className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30"
                >
                  <Sparkles className="w-4 h-4 text-amber-500 mr-1" />
                  <span className="font-medium text-amber-700 dark:text-amber-400">
                    {stats.coinsBalance}
                  </span>
                </Button>

                {/* Notifications */}
                <Button
                  onClick={() => navigate('/notifications')}
                  variant="ghost"
                  size="sm"
                  className="relative"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>

                {/* Mobile Menu Button */}
                <Button
                  onClick={() => setMobileMenuOpen(true)}
                  variant="ghost"
                  size="sm"
                  className="lg:hidden"
                >
                  <Menu className="w-5 h-5" />
                </Button>

                {/* Desktop Navigation */}
                <div className="hidden lg:flex items-center gap-1">
                  <Link to="/matching">
                    <Button variant="ghost" size="sm">
                      <Heart className="w-4 h-4 mr-2" />
                      Matching
                    </Button>
                  </Link>
                  <Link to="/search">
                    <Button variant="ghost" size="sm">
                      <Compass className="w-4 h-4 mr-2" />
                      Discover
                    </Button>
                  </Link>
                  <Link to="/live">
                    <Button variant="ghost" size="sm">
                      <Video className="w-4 h-4 mr-2" />
                      Live
                    </Button>
                  </Link>
                  <Link to="/settings">
                    <Button variant="ghost" size="sm">
                      <Settings className="w-5 h-5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6">
          {/* Loading State */}
          {loading ? (
            <div className="min-h-[60vh] flex items-center justify-center">
              <div className="text-center">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mx-auto mb-4" />
                  <Heart className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-rose-500 animate-pulse" />
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Loading your dashboard...
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Refresh Indicator */}
              {refreshing && (
                <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40">
                  <div className="bg-white dark:bg-gray-900 rounded-full shadow-lg px-4 py-2 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Refreshing...
                    </span>
                  </div>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <StatCard
                  label="Matches"
                  value={stats.totalMatches}
                  icon={<Heart className="w-5 h-5" />}
                  trend={12}
                  trendLabel="vs last week"
                  color="rose"
                  onClick={() => navigate('/matching')}
                />
                <StatCard
                  label="Messages"
                  value={stats.newMessages}
                  icon={<MessageCircle className="w-5 h-5" />}
                  trend={-5}
                  trendLabel="unread"
                  color="purple"
                  onClick={() => navigate('/messages')}
                />
                <StatCard
                  label="Views"
                  value={stats.profileViews}
                  icon={<Eye className="w-5 h-5" />}
                  trend={8}
                  trendLabel="this week"
                  color="blue"
                />
                <StatCard
                  label="Gifts"
                  value={stats.giftsReceived}
                  icon={<Gift className="w-5 h-5" />}
                  trend={3}
                  trendLabel="received"
                  color="emerald"
                  onClick={() => navigate('/gifts')}
                />
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                <TabsList className="w-full grid grid-cols-4 h-auto p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <TabsTrigger value="overview" className="text-xs sm:text-sm py-2">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="matches" className="text-xs sm:text-sm py-2">
                    Matches
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="text-xs sm:text-sm py-2">
                    Activity
                  </TabsTrigger>
                  <TabsTrigger value="achievements" className="text-xs sm:text-sm py-2">
                    Achievements
                  </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="mt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Recent Activity */}
                    <div className="lg:col-span-2 space-y-6">
                      {/* Welcome Card */}
                      <Card className="border-0 shadow-sm bg-gradient-to-r from-rose-500 to-purple-600 text-white overflow-hidden">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div>
                              <h2 className="text-2xl font-bold mb-2">
                                Good {new Date().getHours() < 12 ? 'Morning' : 'Afternoon'}!
                              </h2>
                              <p className="text-white/90 mb-4">
                                You have {stats.newMessages} unread messages and {stats.totalMatches} matches waiting for you.
                              </p>
                              <div className="flex gap-3">
                                <Button
                                  onClick={() => navigate('/discover')}
                                  className="bg-white text-rose-600 hover:bg-gray-100"
                                >
                                  Start Matching
                                  <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                                <Button
                                  onClick={refreshData}
                                  variant="outline"
                                  className="border-white/30 text-white hover:bg-white/20"
                                >
                                  <Loader2 className={cn("w-4 h-4 mr-2", refreshing && "animate-spin")} />
                                  Refresh
                                </Button>
                              </div>
                            </div>
                            <div className="hidden sm:block">
                              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                                <Heart className="w-12 h-12 text-white" />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Recent Activity */}
                      <Card className="border-0 shadow-sm">
                        <CardHeader className="border-b border-gray-200 dark:border-gray-800">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-semibold">
                              Recent Activity
                            </CardTitle>
                            <Button
                              onClick={() => setActiveTab('activity')}
                              variant="ghost"
                              size="sm"
                              className="text-rose-600 dark:text-rose-400"
                            >
                              View All
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4">
                          {recentActivity.length > 0 ? (
                            <div className="space-y-2">
                              {recentActivity.slice(0, 5).map((activity) => (
                                <ActivityItem
                                  key={activity.id}
                                  activity={activity}
                                  onClick={() => activity.actionUrl && navigate(activity.actionUrl)}
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <Activity className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                              <p className="text-gray-600 dark:text-gray-400">
                                No recent activity
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                                Start matching to see activity here
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Right Column - Profile & Achievements */}
                    <div className="space-y-6">
                      {/* Profile Strength */}
                      <Card className="border-0 shadow-sm">
                        <CardContent className="p-6">
                          <div className="text-center">
                            <div className="relative mb-4">
                              <div className="w-24 h-24 mx-auto">
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-2xl font-bold text-rose-500">
                                    {stats.profileStrength}%
                                  </span>
                                </div>
                                <svg className="w-24 h-24 transform -rotate-90">
                                  <defs>
                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                      <stop offset="0%" stopColor="#f43f5e" />
                                      <stop offset="100%" stopColor="#a855f7" />
                                    </linearGradient>
                                  </defs>
                                  <circle
                                    cx="48"
                                    cy="48"
                                    r="44"
                                    fill="none"
                                    stroke="#e2e8f0"
                                    strokeWidth="8"
                                  />
                                  <circle
                                    cx="48"
                                    cy="48"
                                    r="44"
                                    fill="none"
                                    stroke="url(#gradient)"
                                    strokeWidth="8"
                                    strokeDasharray={2 * Math.PI * 44}
                                    strokeDashoffset={2 * Math.PI * 44 * (1 - stats.profileStrength / 100)}
                                    strokeLinecap="round"
                                  />
                                </svg>
                              </div>
                            </div>
                            
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                              Profile Strength
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                              {stats.profileStrength < 50 ? 'Add more details to get better matches' :
                               stats.profileStrength < 80 ? 'Good progress! Keep going' :
                               'Excellent profile! You\'re ready to shine'}
                            </p>
                            
                            <Link to="/profile">
                              <Button className="w-full bg-gradient-to-r from-rose-500 to-purple-500 text-white">
                                {stats.profileStrength < 100 ? 'Complete Profile' : 'View Profile'}
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Daily Likes */}
                      <Card className="border-0 shadow-sm">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                              Daily Likes
                            </h3>
                            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                              {stats.dailyLikes}/{stats.dailyLikesLimit}
                            </Badge>
                          </div>
                          <Progress 
                            value={(stats.dailyLikes / stats.dailyLikesLimit) * 100} 
                            className="h-2 mb-2"
                          />
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {stats.dailyLikesLimit - stats.dailyLikes} likes remaining today
                          </p>
                          {stats.subscriptionTier === 'free' && (
                            <Link to="/vip">
                              <Button variant="link" className="text-rose-600 dark:text-rose-400 text-xs p-0 h-auto mt-2">
                                Upgrade for unlimited likes
                                <ChevronRight className="w-3 h-3 ml-1" />
                              </Button>
                            </Link>
                          )}
                        </CardContent>
                      </Card>

                      {/* VIP Status */}
                      <Card className="border-0 shadow-sm overflow-hidden bg-gradient-to-br from-amber-500 to-rose-500">
                        <CardContent className="p-6 text-center">
                          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            {stats.subscriptionTier === 'vip' ? (
                              <Crown className="w-8 h-8 text-white" />
                            ) : stats.subscriptionTier === 'premium' ? (
                              <Star className="w-8 h-8 text-white" />
                            ) : (
                              <Sparkles className="w-8 h-8 text-white" />
                            )}
                          </div>
                          
                          <h3 className="font-bold text-white text-lg mb-2">
                            {stats.subscriptionTier === 'vip' ? 'VIP Member' :
                             stats.subscriptionTier === 'premium' ? 'Premium Member' :
                             'Free Account'}
                          </h3>
                          
                          <p className="text-white/80 text-sm mb-4">
                            {stats.subscriptionTier === 'free' 
                              ? 'Upgrade to unlock premium features'
                              : 'Enjoying premium benefits!'}
                          </p>
                          
                          <Link to="/vip">
                            <Button className="w-full bg-white text-gray-900 hover:bg-gray-100">
                              {stats.subscriptionTier === 'free' ? (
                                <>
                                  <Crown className="w-4 h-4 mr-2" />
                                  View Plans
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-4 h-4 mr-2" />
                                  Manage Subscription
                                </>
                              )}
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>

                      {/* Quick Actions */}
                      <Card className="border-0 shadow-sm">
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                            Quick Actions
                          </h3>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              onClick={() => navigate('/search')}
                              variant="outline"
                              className="border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                            >
                              <Search className="w-4 h-4 mr-2" />
                              Discover
                            </Button>
                            <Button
                              onClick={() => navigate('/gifts')}
                              variant="outline"
                              className="border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                            >
                              <Gift className="w-4 h-4 mr-2" />
                              Gifts
                            </Button>
                            <Button
                              onClick={() => navigate('/live')}
                              variant="outline"
                              className="border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                            >
                              <Video className="w-4 h-4 mr-2" />
                              Live
                            </Button>
                            <Button
                              onClick={() => navigate('/wallet')}
                              variant="outline"
                              className="border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                            >
                              <Wallet className="w-4 h-4 mr-2" />
                              Wallet
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                {/* Matches Tab */}
                <TabsContent value="matches" className="mt-6">
                  {matchSuggestions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {matchSuggestions.map((suggestion) => (
                        <MatchSuggestionCard
                          key={suggestion.id}
                          suggestion={suggestion}
                          onLike={() => handleSwipe(suggestion.id, 'like')}
                          onPass={() => handleSwipe(suggestion.id, 'pass')}
                        />
                      ))}
                    </div>
                  ) : (
                    <Card className="border-0 shadow-sm">
                      <CardContent className="p-12 text-center">
                        <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          No Matches Yet
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                          Start swiping to find your perfect match! We'll show you personalized recommendations based on your preferences.
                        </p>
                        <Link to="/discover">
                          <Button className="bg-gradient-to-r from-rose-500 to-purple-500 text-white">
                            Start Matching
                            <ChevronRight className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Activity Tab */}
                <TabsContent value="activity" className="mt-6">
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="border-b border-gray-200 dark:border-gray-800">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold">
                          All Activity
                        </CardTitle>
                        {unreadCount > 0 && (
                          <Button
                            onClick={markAllAsRead}
                            variant="ghost"
                            size="sm"
                            className="text-rose-600 dark:text-rose-400"
                          >
                            Mark all as read
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      {recentActivity.length > 0 ? (
                        <div className="space-y-2">
                          {recentActivity.map((activity) => (
                            <ActivityItem
                              key={activity.id}
                              activity={activity}
                              onClick={() => activity.actionUrl && navigate(activity.actionUrl)}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Activity className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                          <p className="text-gray-600 dark:text-gray-400">
                            No activity yet
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Achievements Tab */}
                <TabsContent value="achievements" className="mt-6">
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="border-b border-gray-200 dark:border-gray-800">
                      <CardTitle className="text-lg font-semibold">
                        Achievements & Rewards
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      {achievements.length > 0 ? (
                        <div className="space-y-3">
                          {achievements.map((achievement) => (
                            <AchievementCard key={achievement.id} achievement={achievement} />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Award className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                          <p className="text-gray-600 dark:text-gray-400">
                            No achievements yet
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                            Keep using the app to unlock achievements
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </main>
      </div>
    </AuthGuard>
  );
};

export default Dashboard;