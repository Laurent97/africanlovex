import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Heart, 
  MessageCircle, 
  Users, 
  Eye, 
  Star, 
  TrendingUp, 
  Calendar,
  MapPin,
  Gift,
  Crown,
  Shield,
  Activity,
  Clock,
  ChevronRight,
  Bell,
  Settings,
  Search,
  Filter,
  User,
  Sparkles,
  Zap,
  Loader2,
  Coffee,
  Music,
  Camera,
  Book,
  Briefcase,
  Globe,
  Award,
  ChevronLeft,
  Menu,
  X,
  Compass,
  Video,
  Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

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
  subscriptionTier: string;
}

interface RecentActivity {
  id: string;
  type: 'match' | 'message' | 'like' | 'gift' | 'profile_view' | 'subscription';
  user: {
    id: string;
    name: string;
    avatar: string;
    age: number;
    verified: boolean;
  };
  message: string;
  timestamp: Date;
  actionUrl?: string;
  metadata?: any;
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
  isOnline: boolean;
  lastActive: Date;
}

interface Notification {
  id: string;
  type: string;
  read: boolean;
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Real data states
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
    subscriptionTier: 'free'
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [matchSuggestions, setMatchSuggestions] = useState<MatchSuggestion[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Load real data on mount
  useEffect(() => {
    if (user) {
      loadDashboardData();
      setupRealtimeSubscriptions();
    }
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadUserProfile(),
        loadMatchStats(),
        loadRecentActivity(),
        loadMatchSuggestions(),
        loadNotifications()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

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

  const loadMatchStats = async () => {
    if (!user) return;
    
    // Get total matches
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
      .eq('read_status', false);

    // Get profile views (from analytics table - you'd need to create this)
    const { count: viewsCount } = await supabase
      .from('profile_views')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', user.id)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

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

    setStats(prev => ({
      ...prev,
      totalMatches: matchesCount || 0,
      newMessages: messagesCount || 0,
      profileViews: viewsCount || 0,
      giftsReceived: giftsReceived || 0,
      giftsSent: giftsSent || 0
    }));
  };

  const loadRecentActivity = async () => {
    const activities: RecentActivity[] = [];

    // Get recent matches
    const { data: matches } = await supabase
      .from('matches')
      .select(`
        *,
        user1:user1_id (
          username,
          full_name,
          avatar_url,
          age
        ),
        user2:user2_id (
          username,
          full_name,
          avatar_url,
          age
        )
      `)
      .or(`user1_id.eq.${user?.id},user2_id.eq.${user?.id}`)
      .eq('status', 'matched')
      .order('created_at', { ascending: false })
      .limit(5);

    if (matches) {
      matches.forEach(match => {
        const matchedUser = match.user1_id === user?.id ? match.user2 : match.user1;
        activities.push({
          id: `match-${match.id}`,
          type: 'match',
          user: {
            id: matchedUser.id,
            name: matchedUser.full_name || matchedUser.username || 'Anonymous',
            avatar: matchedUser.avatar_url || '',
            age: matchedUser.age || 25,
            verified: false // Add verification logic
          },
          message: `You matched with ${matchedUser.full_name || matchedUser.username}!`,
          timestamp: new Date(match.created_at),
          actionUrl: `/chat/${matchedUser.id}?newMatch=true`
        });
      });
    }

    // Get recent messages
    const { data: messages } = await supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id (
          username,
          full_name,
          avatar_url,
          age
        )
      `)
      .eq('receiver_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (messages) {
      messages.forEach(msg => {
        activities.push({
          id: `msg-${msg.id}`,
          type: 'message',
          user: {
            id: msg.sender_id,
            name: msg.sender?.full_name || msg.sender?.username || 'Anonymous',
            avatar: msg.sender?.avatar_url || '',
            age: msg.sender?.age || 25,
            verified: false
          },
          message: msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : ''),
          timestamp: new Date(msg.created_at),
          actionUrl: `/chat/${msg.sender_id}`
        });
      });
    }

    // Get recent gifts
    const { data: gifts } = await supabase
      .from('sent_gifts')
      .select(`
        *,
        sender:from_user_id (
          username,
          full_name,
          avatar_url,
          age
        ),
        gift:gift_id (
          name,
          icon_url
        )
      `)
      .eq('to_user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (gifts) {
      gifts.forEach(gift => {
        activities.push({
          id: `gift-${gift.id}`,
          type: 'gift',
          user: {
            id: gift.from_user_id,
            name: gift.sender?.full_name || gift.sender?.username || 'Anonymous',
            avatar: gift.sender?.avatar_url || '',
            age: gift.sender?.age || 25,
            verified: false
          },
          message: `Received a ${gift.gift?.name || 'gift'}! 🎁`,
          timestamp: new Date(gift.created_at),
          actionUrl: `/chat/${gift.from_user_id}`,
          metadata: { giftName: gift.gift?.name }
        });
      });
    }

    // Sort by timestamp and take latest 10
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    setRecentActivity(activities.slice(0, 10));
  };

  const loadMatchSuggestions = async () => {
    // Get current user's interests for better matching
    const { data: currentUser } = await supabase
      .from('profiles')
      .select('interests, age, city, country')
      .eq('id', user.id)
      .single();

    // Get potential matches (excluding current user and already matched)
    const { data: swipedProfiles } = await supabase
      .from('swipe_history')
      .select('profile_id')
      .eq('user_id', user.id);

    const swipedIds = swipedProfiles?.map(s => s.profile_id) || [];

    let query = supabase
      .from('profiles')
      .select('*')
      .neq('id', user.id)
      .limit(6);

    // Only add the filter if there are swiped IDs
    if (swipedIds.length > 0) {
      query = query.not('id', 'in', `(${swipedIds.join(',')})`);
    }

    const { data: profiles } = await query;

    if (profiles) {
      const suggestions: MatchSuggestion[] = profiles.map(profile => ({
        id: profile.id,
        name: profile.full_name || profile.username || 'Anonymous',
        age: profile.age || 25,
        location: `${profile.city || ''}, ${profile.country || ''}`.trim().replace(/^,/, '') || 'Location unknown',
        city: profile.city || '',
        country: profile.country || '',
        avatar: profile.avatar_url || '',
        matchPercentage: calculateMatchPercentage(currentUser, profile),
        interests: profile.interests || [],
        verified: profile.is_verified || false,
        vipTier: profile.vip_tier || 'free',
        isOnline: profile.last_active ? isUserOnline(profile.last_active) : false,
        lastActive: profile.last_active ? new Date(profile.last_active) : new Date()
      }));

      // Sort by match percentage
      suggestions.sort((a, b) => b.matchPercentage - a.matchPercentage);
      setMatchSuggestions(suggestions.slice(0, 3));
    }
  };

  const loadNotifications = async () => {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user?.id)
      .eq('read', false);

    setUnreadNotifications(count || 0);
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to new messages
    const messageSubscription = supabase
      .channel('dashboard-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user?.id}`
        },
        (payload) => {
          // Reload recent activity when new message arrives
          loadRecentActivity();
          setStats(prev => ({ ...prev, newMessages: prev.newMessages + 1 }));
        }
      )
      .subscribe();

    // Subscribe to new matches
    const matchSubscription = supabase
      .channel('dashboard-matches')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
          filter: `user1_id=eq.${user?.id} OR user2_id=eq.${user?.id}`
        },
        () => {
          loadRecentActivity();
          setStats(prev => ({ ...prev, totalMatches: prev.totalMatches + 1 }));
        }
      )
      .subscribe();

    // Subscribe to new gifts
    const giftSubscription = supabase
      .channel('dashboard-gifts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sent_gifts',
          filter: `to_user_id=eq.${user?.id}`
        },
        () => {
          loadRecentActivity();
          setStats(prev => ({ ...prev, giftsReceived: prev.giftsReceived + 1 }));
        }
      )
      .subscribe();

    return () => {
      messageSubscription.unsubscribe();
      matchSubscription.unsubscribe();
      giftSubscription.unsubscribe();
    };
  };

  // Helper functions
  const calculateMatchPercentage = (user1: any, user2: any): number => {
    if (!user1 || !user2) return Math.floor(Math.random() * 30) + 60;
    
    let score = 60; // Base score

    // Age compatibility (up to 10 points)
    const ageDiff = Math.abs((user1.age || 25) - (user2.age || 25));
    if (ageDiff <= 3) score += 10;
    else if (ageDiff <= 7) score += 5;
    else if (ageDiff <= 12) score += 2;

    // Interest overlap (up to 15 points)
    const interests1 = user1.interests || [];
    const interests2 = user2.interests || [];
    const commonInterests = interests1.filter((i: string) => interests2.includes(i)).length;
    score += Math.min(commonInterests * 3, 15);

    // Location compatibility (up to 10 points)
    if (user1.city && user2.city && user1.city === user2.city) score += 10;
    else if (user1.country && user2.country && user1.country === user2.country) score += 5;

    // Verification bonus (up to 5 points)
    if (user2.is_verified) score += 5;

    return Math.min(Math.round(score), 99);
  };

  const calculateProfileStrength = (profile: any): number => {
    let score = 0;
    const totalFields = 8;

    if (profile.full_name) score++;
    if (profile.bio && profile.bio.length > 20) score++;
    if (profile.avatar_url) score++;
    if (profile.interests && profile.interests.length >= 3) score++;
    if (profile.photos && profile.photos.length >= 2) score++;
    if (profile.age) score++;
    if (profile.city && profile.country) score++;
    if (profile.is_verified) score++;

    return Math.round((score / totalFields) * 100);
  };

  const isUserOnline = (lastActive: string): boolean => {
    if (!lastActive) return false;
    const diff = Date.now() - new Date(lastActive).getTime();
    return diff < 5 * 60 * 1000; // 5 minutes
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    const iconProps = { className: "w-5 h-5" };
    
    switch (type) {
      case 'match':
        return <Heart {...iconProps} className="text-rose-500" />;
      case 'message':
        return <MessageCircle {...iconProps} className="text-purple-500" />;
      case 'gift':
        return <Gift {...iconProps} className="text-emerald-500" />;
      default:
        return <Activity {...iconProps} className="text-amber-500" />;
    }
  };

  const getMatchPercentageColor = (percentage: number) => {
    if (percentage >= 90) return 'from-emerald-500 to-green-500';
    if (percentage >= 80) return 'from-blue-500 to-cyan-500';
    if (percentage >= 70) return 'from-purple-500 to-pink-500';
    return 'from-amber-500 to-orange-500';
  };

  if (!user) return null;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-rose-950/20">
        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed right-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-900 z-50 shadow-2xl lg:hidden"
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Menu</h3>
                <Button
                  onClick={() => setMobileMenuOpen(false)}
                  variant="ghost"
                  size="sm"
                  className="p-0 h-8 w-8"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="p-4 space-y-2">
                <Link to="/matching" className="block">
                  <Button variant="ghost" className="w-full justify-start">
                    <Heart className="w-4 h-4 mr-2" />
                    Matching
                  </Button>
                </Link>
                <Link to="/search" className="block">
                  <Button variant="ghost" className="w-full justify-start">
                    <Compass className="w-4 h-4 mr-2" />
                    Discover
                  </Button>
                </Link>
                <Link to="/live" className="block">
                  <Button variant="ghost" className="w-full justify-start">
                    <Video className="w-4 h-4 mr-2" />
                    Live
                  </Button>
                </Link>
                <Link to="/gifts" className="block">
                  <Button variant="ghost" className="w-full justify-start">
                    <Gift className="w-4 h-4 mr-2" />
                    Gifts
                  </Button>
                </Link>
                <Link to="/wallet" className="block">
                  <Button variant="ghost" className="w-full justify-start">
                    <Wallet className="w-4 h-4 mr-2" />
                    Wallet
                  </Button>
                </Link>
                <div className="border-t border-gray-200 dark:border-gray-800 my-2 pt-2">
                  <Link to="/notifications" className="block">
                    <Button variant="ghost" className="w-full justify-start">
                      <Bell className="w-4 h-4 mr-2" />
                      Notifications
                      {unreadNotifications > 0 && (
                        <Badge className="ml-auto bg-rose-500 text-white">
                          {unreadNotifications}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                  <Link to="/settings" className="block">
                    <Button variant="ghost" className="w-full justify-start">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-rose-200 dark:border-rose-900/30">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Mobile Menu Button */}
                <Button
                  onClick={() => setMobileMenuOpen(true)}
                  variant="ghost"
                  size="sm"
                  className="lg:hidden text-gray-700 dark:text-gray-300"
                >
                  <Menu className="w-6 h-6" />
                </Button>

                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
                    Dashboard
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Welcome back, {userProfile?.full_name || user.email?.split('@')[0] || 'User'}!
                  </p>
                </motion.div>
              </div>

              <div className="flex items-center gap-2 sm:gap-4">
                {/* Desktop Navigation */}
                <div className="hidden lg:flex items-center gap-2">
                  <Link to="/matching">
                    <Button variant="ghost" size="sm" className="text-gray-700 dark:text-gray-300">
                      <Heart className="w-4 h-4 mr-2" />
                      Matching
                    </Button>
                  </Link>
                  <Link to="/search">
                    <Button variant="ghost" size="sm" className="text-gray-700 dark:text-gray-300">
                      <Compass className="w-4 h-4 mr-2" />
                      Discover
                    </Button>
                  </Link>
                  <Link to="/live">
                    <Button variant="ghost" size="sm" className="text-gray-700 dark:text-gray-300">
                      <Video className="w-4 h-4 mr-2" />
                      Live
                    </Button>
                  </Link>
                </div>

                {/* Coin Balance */}
                <Button
                  onClick={() => navigate('/wallet')}
                  variant="outline"
                  size="sm"
                  className="border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30"
                >
                  <Sparkles className="w-4 h-4 text-amber-500 mr-2" />
                  <span className="font-bold text-amber-700 dark:text-amber-400">
                    {stats.coinsBalance} LX
                  </span>
                </Button>

                {/* Notifications */}
                <Link to="/notifications">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="relative text-gray-700 dark:text-gray-300"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadNotifications > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                        {unreadNotifications}
                      </span>
                    )}
                  </Button>
                </Link>

                {/* Settings */}
                <Link to="/settings" className="hidden sm:block">
                  <Button variant="ghost" size="sm" className="text-gray-700 dark:text-gray-300">
                    <Settings className="w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mx-auto mb-4"></div>
                <Heart className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-rose-500 animate-pulse" />
              </div>
              <p className="text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
            </div>
          </div>
        ) : (
          <div className="container mx-auto px-4 py-8">
            {/* Stats Overview */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
            >
              {[
                {
                  label: 'Total Matches',
                  value: stats.totalMatches,
                  icon: <Heart className="w-5 h-5" />,
                  bgColor: 'bg-rose-500',
                  lightBg: 'bg-rose-50 dark:bg-rose-950/30',
                  textColor: 'text-rose-600 dark:text-rose-400',
                  change: `+${Math.floor(stats.totalMatches * 0.1)} this week`
                },
                {
                  label: 'New Messages',
                  value: stats.newMessages,
                  icon: <MessageCircle className="w-5 h-5" />,
                  bgColor: 'bg-purple-500',
                  lightBg: 'bg-purple-50 dark:bg-purple-950/30',
                  textColor: 'text-purple-600 dark:text-purple-400',
                  change: `${stats.newMessages} unread`
                },
                {
                  label: 'Profile Views',
                  value: stats.profileViews,
                  icon: <Eye className="w-5 h-5" />,
                  bgColor: 'bg-blue-500',
                  lightBg: 'bg-blue-50 dark:bg-blue-950/30',
                  textColor: 'text-blue-600 dark:text-blue-400',
                  change: `+${stats.profileViews} this week`
                },
                {
                  label: 'Gifts Received',
                  value: stats.giftsReceived,
                  icon: <Gift className="w-5 h-5" />,
                  bgColor: 'bg-emerald-500',
                  lightBg: 'bg-emerald-50 dark:bg-emerald-950/30',
                  textColor: 'text-emerald-600 dark:text-emerald-400',
                  change: `+${stats.giftsSent} sent`
                }
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="group"
                >
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 rounded-2xl ${stat.lightBg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <div className={`${stat.textColor}`}>
                            {stat.icon}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                          <Activity className="w-3 h-3" />
                          <span>+12%</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {stat.value}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {stat.label}
                        </p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400">
                          {stat.change}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent Activity */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="lg:col-span-2"
              >
                <Card className="border-0 shadow-lg bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
                        Recent Activity
                      </CardTitle>
                      <Link to="/notifications">
                        <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400">
                          View All
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-4">
                      {recentActivity.length > 0 ? (
                        recentActivity.map((activity, index) => (
                          <motion.div
                            key={activity.id}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            onClick={() => activity.actionUrl && navigate(activity.actionUrl)}
                            className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900/50 hover:shadow-md transition-all cursor-pointer group"
                          >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              activity.type === 'match' ? 'bg-rose-100 dark:bg-rose-900/30' :
                              activity.type === 'message' ? 'bg-purple-100 dark:bg-purple-900/30' :
                              activity.type === 'gift' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                              'bg-amber-100 dark:bg-amber-900/30'
                            }`}>
                              {getActivityIcon(activity.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                                    {activity.user.name}
                                  </h4>
                                  {activity.user.verified && (
                                    <Shield className="w-3 h-3 text-emerald-500" />
                                  )}
                                </div>
                                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
                                  {formatTime(activity.timestamp)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {activity.message}
                              </p>
                              {activity.metadata?.giftName && (
                                <Badge className="mt-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0 text-xs">
                                  {activity.metadata.giftName}
                                </Badge>
                              )}
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </motion.div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <Activity className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                          <p className="text-gray-600 dark:text-gray-400">No recent activity</p>
                          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                            Start matching to see activity here
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Right Column */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="space-y-6"
              >
                {/* Profile Strength */}
                <Card className="border-0 shadow-lg bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm overflow-hidden">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <div className="relative mb-4">
                        <div className="w-24 h-24 mx-auto">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-3xl font-bold text-rose-500">
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
                              strokeDasharray={`${2 * Math.PI * 44}`}
                              strokeDashoffset={`${2 * Math.PI * 44 * (1 - stats.profileStrength / 100)}`}
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
                      <Progress value={stats.profileStrength} className="h-2 mb-4" />
                      <Link to="/profile">
                        <Button className="w-full bg-gradient-to-r from-rose-500 to-purple-500 text-white hover:from-rose-600 hover:to-purple-600">
                          {stats.profileStrength < 100 ? 'Complete Profile' : 'View Profile'}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                {/* VIP Status */}
                <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      {stats.subscriptionTier === 'vip' ? (
                        <Crown className="w-8 h-8 text-white" />
                      ) : stats.subscriptionTier === 'premium' ? (
                        <Star className="w-8 h-8 text-white" />
                      ) : (
                        <Sparkles className="w-8 h-8 text-white" />
                      )}
                    </div>
                    <h3 className="font-bold text-white text-xl mb-2">
                      {stats.subscriptionTier === 'vip' ? 'VIP Member' :
                       stats.subscriptionTier === 'premium' ? 'Premium Member' :
                       'Free Account'}
                    </h3>
                    <p className="text-white/80 text-sm mb-4">
                      {stats.subscriptionTier === 'free' 
                        ? 'Upgrade to unlock premium features and find your perfect match faster'
                        : 'Enjoying premium benefits! Check out what\'s new'}
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
                <Card className="border-0 shadow-lg bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm overflow-hidden">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      Quick Actions
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Link to="/search">
                        <Button variant="outline" className="w-full border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30">
                          <Search className="w-4 h-4 mr-2" />
                          Discover
                        </Button>
                      </Link>
                      <Link to="/gifts">
                        <Button variant="outline" className="w-full border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30">
                          <Gift className="w-4 h-4 mr-2" />
                          Gifts
                        </Button>
                      </Link>
                      <Link to="/live">
                        <Button variant="outline" className="w-full border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30">
                          <Video className="w-4 h-4 mr-2" />
                          Live
                        </Button>
                      </Link>
                      <Link to="/wallet">
                        <Button variant="outline" className="w-full border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
                          <Wallet className="w-4 h-4 mr-2" />
                          Wallet
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Match Suggestions */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-8"
            >
              <Card className="border-0 shadow-lg bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm overflow-hidden">
                <CardHeader className="border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
                      Recommended for You
                    </CardTitle>
                    <Link to="/search">
                      <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400">
                        See More
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  {matchSuggestions.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {matchSuggestions.map((suggestion, index) => (
                        <motion.div
                          key={suggestion.id}
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          whileHover={{ y: -4 }}
                          onClick={() => navigate(`/profile/${suggestion.id}`)}
                          className="cursor-pointer group"
                        >
                          <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-rose-50/30 dark:from-gray-900 dark:to-rose-950/20 overflow-hidden">
                            <CardContent className="p-4">
                              <div className="relative">
                                {/* Match Percentage */}
                                <div className="absolute -top-2 -right-2 z-10">
                                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getMatchPercentageColor(suggestion.matchPercentage)} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                                    {suggestion.matchPercentage}%
                                  </div>
                                </div>

                                {/* Avatar */}
                                <div className="relative mb-3">
                                  <Avatar className="w-20 h-20 mx-auto ring-4 ring-rose-100 dark:ring-rose-900/30 group-hover:scale-110 transition-transform">
                                    <AvatarImage src={suggestion.avatar} />
                                    <AvatarFallback className="bg-gradient-to-r from-rose-500 to-purple-500 text-white text-xl">
                                      {suggestion.name[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  
                                  {/* Online Indicator */}
                                  {suggestion.isOnline && (
                                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse" />
                                  )}
                                  
                                  {/* Verified Badge */}
                                  {suggestion.verified && (
                                    <div className="absolute top-0 left-0">
                                      <Shield className="w-5 h-5 text-emerald-500 fill-emerald-500" />
                                    </div>
                                  )}
                                  
                                  {/* VIP Badge */}
                                  {suggestion.vipTier !== 'free' && (
                                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                                      <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0 text-xs whitespace-nowrap">
                                        {suggestion.vipTier === 'vip' ? <Crown className="w-3 h-3 mr-1" /> : <Star className="w-3 h-3 mr-1" />}
                                        {suggestion.vipTier}
                                      </Badge>
                                    </div>
                                  )}
                                </div>

                                {/* Info */}
                                <div className="text-center">
                                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                    {suggestion.name}, {suggestion.age}
                                  </h4>
                                  <div className="flex items-center justify-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-2">
                                    <MapPin className="w-3 h-3" />
                                    <span className="truncate max-w-[120px]">{suggestion.location}</span>
                                  </div>
                                  
                                  {/* Interests */}
                                  <div className="flex flex-wrap gap-1 justify-center mb-3">
                                    {suggestion.interests.slice(0, 3).map((interest, i) => (
                                      <Badge key={i} className="bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-0 text-xs">
                                        {interest}
                                      </Badge>
                                    ))}
                                  </div>

                                  {/* Last Active */}
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Active {formatTime(suggestion.lastActive)}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-gray-600 dark:text-gray-400">No match suggestions yet</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                        Complete your profile to get personalized recommendations
                      </p>
                      <Link to="/profile">
                        <Button className="mt-4 bg-gradient-to-r from-rose-500 to-purple-500 text-white">
                          Complete Profile
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
};

export default Dashboard;