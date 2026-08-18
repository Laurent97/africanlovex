import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  SlidersHorizontal,
  X,
  ChevronDown,
  Loader2,
  MapPin,
  Heart,
  Users,
  Sparkles,
  Star,
  Crown,
  Shield,
  CheckCircle,
  Clock,
  TrendingUp,
  Compass,
  RefreshCw,
  Eye,
  EyeOff,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Share2,
  Flag,
  MoreVertical,
  User,
  Settings,
  Bell,
  Home,
  Globe,
  Calendar,
  Briefcase,
  GraduationCap,
  Languages,
  Music,
  Camera,
  Coffee,
  Book,
  Gamepad2,
  Zap,
  Sun,
  Moon,
  Cloud,
  Wind,
  Thermometer,
  Droplets,
  Sunrise,
  Sunset,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { ResponsiveProfileCard } from '@/components/profile/ResponsiveProfileCard';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useKeyboard } from '@/hooks/useKeyboard';
import { useDebounce } from '@/hooks/useDebounce';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { searchProfiles } from '@/lib/profile';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Database } from '@/lib/supabase';

// Types
interface UserProfile {
  id: string;
  username: string;
  full_name: string | null;
  age: number | null;
  country: string | null;
  city: string | null;
  bio: string | null;
  avatar_url: string | null;
  photos?: string[];
  interests: string[] | null;
  languages: string[] | null;
  gender: 'male' | 'female' | 'other' | null;
  relationship_intention: 'looking_for_love' | 'serious_only' | 'friends_first' | 'sugar_daddy' | 'sugar_mommy' | null;
  is_verified: boolean;
  vip_tier: 'free' | 'basic' | 'premium' | 'platinum' | 'diamond';
  verification_level: 'basic' | 'standard' | 'premium';
  distance?: number;
  last_active?: string;
  is_online?: boolean;
  height?: number;
  education?: string;
  profession?: string;
  zodiac?: string;
  personality_traits?: string[];
  deal_breakers?: string[];
  ideal_match?: string;
}

interface FilterState {
  ageRange: [number, number];
  maxDistance: number;
  selectedInterests: string[];
  showVerifiedOnly: boolean;
  genderPreference: 'all' | 'male' | 'female' | 'other';
  relationshipIntentions: string[];
  sortBy: 'distance' | 'age' | 'recently_active' | 'match_percentage';
  hasPhotos: boolean;
  minHeight?: number;
  maxHeight?: number;
  education?: string[];
  languages?: string[];
}

interface SwipeHistory {
  profileId: string;
  action: 'like' | 'pass' | 'super_like';
  timestamp: number;
}

// Constants
const RELATIONSHIP_INTENTIONS = [
  { value: 'looking_for_love', label: 'Looking for Love', icon: Heart },
  { value: 'serious_only', label: 'Serious Only', icon: Star },
  { value: 'friends_first', label: 'Friends First', icon: Users },
  { value: 'sugar_daddy', label: 'Sugar Daddy/Mommy', icon: Crown }
];

const SORT_OPTIONS = [
  { value: 'distance', label: 'Nearest', icon: MapPin },
  { value: 'age', label: 'Age', icon: Calendar },
  { value: 'recently_active', label: 'Recently Active', icon: Clock },
  { value: 'match_percentage', label: 'Best Match', icon: TrendingUp }
];

const EDUCATION_LEVELS = [
  'High School',
  'Some College',
  'Associate Degree',
  'Bachelor\'s',
  'Master\'s',
  'PhD',
  'Trade School'
];

const PERSONALITY_TRAITS = [
  'Adventurous',
  'Ambitious',
  'Creative',
  'Empathetic',
  'Extroverted',
  'Funny',
  'Introverted',
  'Loyal',
  'Passionate',
  'Romantic',
  'Spiritual',
  'Thoughtful'
];

// Utility Functions
const calculateDistance = (profile: UserProfile, userLocation?: { lat: number; lng: number }): number => {
  if (!userLocation || !profile.city) {
    return Math.floor(Math.random() * 50) + 1; // Placeholder
  }
  // Implement actual distance calculation here
  return Math.floor(Math.random() * 50) + 1;
};

const calculateMatchPercentage = (profile: UserProfile, userProfile?: UserProfile): number => {
  if (!userProfile) return Math.floor(Math.random() * 40) + 60;
  
  let score = 60; // Base score
  
  // Age compatibility
  if (profile.age && userProfile.age) {
    const ageDiff = Math.abs(profile.age - userProfile.age);
    if (ageDiff <= 3) score += 10;
    else if (ageDiff <= 7) score += 5;
    else if (ageDiff <= 12) score += 2;
  }
  
  // Interest overlap
  const profileInterests = profile.interests || [];
  const userInterests = userProfile.interests || [];
  const commonInterests = profileInterests.filter(i => userInterests.includes(i)).length;
  score += Math.min(commonInterests * 5, 15);
  
  // Location compatibility
  if (profile.city && userProfile.city && profile.city === userProfile.city) {
    score += 10;
  }
  
  // Relationship intention match
  if (profile.relationship_intention && userProfile.relationship_intention && 
      profile.relationship_intention === userProfile.relationship_intention) {
    score += 15;
  }
  
  // Verified bonus
  if (profile.is_verified) score += 5;
  
  return Math.min(Math.round(score), 99);
};

const formatLastActive = (lastActive?: string): string => {
  if (!lastActive) return 'Unknown';
  
  const now = new Date();
  const last = new Date(lastActive);
  const diffMinutes = Math.floor((now.getTime() - last.getTime()) / 60000);
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
  if (diffMinutes < 10080) return `${Math.floor(diffMinutes / 1440)}d ago`;
  
  return last.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Components
const FilterChip: React.FC<{
  label: string;
  icon?: React.ReactNode;
  active?: boolean;
  onClick: () => void;
}> = ({ label, icon, active, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-1 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all touch-target",
      active 
        ? "bg-gradient-to-r from-rose-500 to-purple-500 text-white shadow-md" 
        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
    )}
  >
    {icon}
    {label}
  </button>
);

const QuickFilterBar: React.FC<{
  filters: FilterState;
  onFilterChange: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
}> = ({ filters, onFilterChange }) => {
  const quickFilters = [
    { 
      label: 'Nearby', 
      icon: <MapPin className="w-3.5 h-3.5" />,
      active: filters.sortBy === 'distance',
      onClick: () => onFilterChange('sortBy', filters.sortBy === 'distance' ? 'recently_active' : 'distance')
    },
    { 
      label: 'Verified', 
      icon: <Shield className="w-3.5 h-3.5" />,
      active: filters.showVerifiedOnly,
      onClick: () => onFilterChange('showVerifiedOnly', !filters.showVerifiedOnly)
    },
    { 
      label: 'Photos', 
      icon: <Camera className="w-3.5 h-3.5" />,
      active: filters.hasPhotos,
      onClick: () => onFilterChange('hasPhotos', !filters.hasPhotos)
    },
    { 
      label: 'Online', 
      icon: <Users className="w-3.5 h-3.5" />,
      active: false,
      onClick: () => {}
    }
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {quickFilters.map(filter => (
        <FilterChip
          key={filter.label}
          label={filter.label}
          icon={filter.icon}
          active={filter.active}
          onClick={filter.onClick}
        />
      ))}
    </div>
  );
};

const ProfileSkeleton: React.FC<{ variant?: 'grid' | 'list' }> = ({ variant = 'grid' }) => {
  if (variant === 'list') {
    return (
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="flex gap-4 p-4">
          <div className="w-20 h-20 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <div className="aspect-[3/4] bg-gray-200 dark:bg-gray-700 animate-pulse" />
      <CardContent className="p-4">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2 animate-pulse" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3 animate-pulse" />
        <div className="flex gap-1 mb-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
          ))}
        </div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse" />
      </CardContent>
    </Card>
  );
};

const EmptyState: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: { label: string; onClick: () => void };
}> = ({ title, description, icon, action }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center py-12"
  >
    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
      {icon}
    </div>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
      {title}
    </h3>
    <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
      {description}
    </p>
    {action && (
      <Button onClick={action.onClick} className="bg-gradient-to-r from-rose-500 to-purple-500 text-white">
        {action.label}
      </Button>
    )}
  </motion.div>
);

// Main Component
export const DiscoverPage = () => {
  const navigate = useNavigate();
  const { isKeyboardVisible } = useKeyboard();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [swipeHistory, setSwipeHistory] = useLocalStorage<SwipeHistory[]>('swipe_history', []);
  const [likedProfiles, setLikedProfiles] = useState<Set<string>>(new Set());
  const [passedProfiles, setPassedProfiles] = useState<Set<string>>(new Set());
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    ageRange: [18, 80],
    maxDistance: 50,
    selectedInterests: [],
    showVerifiedOnly: false,
    genderPreference: 'all',
    relationshipIntentions: [],
    sortBy: 'match_percentage',
    hasPhotos: false
  });

  // Refs
  const observerRef = useRef<IntersectionObserver>();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const searchDebounced = useDebounce(searchQuery, 500);

  // Load user's location
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>();
  
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          console.log('Location permission denied');
        }
      );
    }
  }, []);

  // Fetch profiles
  const fetchProfiles = useCallback(async (pageNum: number, reset = false) => {
    if (!user) return;

    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);
      
      const result = await searchProfiles({
        page: pageNum,
        limit: 20,
        age_min: filters.ageRange[0],
        age_max: filters.ageRange[1],
        max_distance: filters.maxDistance,
        interests: filters.selectedInterests,
        verified_only: filters.showVerifiedOnly,
        gender: filters.genderPreference !== 'all' ? filters.genderPreference : undefined,
        relationship_intentions: filters.relationshipIntentions,
        has_photos: filters.hasPhotos,
        sort_by: filters.sortBy,
        search_query: searchDebounced || undefined
      });

      console.log('searchProfiles result:', result); // Debug log

      // If no profiles from database, add mock data for testing
      let newProfiles = result.profiles || [];
      if (!result.profiles || result.profiles.length === 0) {
        console.log('No profiles from database, using mock data');
        newProfiles = [
          {
            id: 'mock-1',
            username: 'sarah_j',
            full_name: 'Sarah Johnson',
            avatar_url: 'https://picsum.photos/seed/sarah/200/200.jpg',
            bio: 'Passionate about photography and exploring new cultures. Looking for someone who loves adventure!',
            age: 28,
            gender: 'female' as const,
            country: 'Rwanda',
            city: 'Kigali',
            languages: ['English', 'Kinyarwanda'],
            interests: ['Photography', 'Travel', 'Cooking', 'Music'],
            relationship_intention: 'looking_for_love',
            verification_level: 'standard',
            is_verified: true,
            is_premium: true,
            vip_tier: 'premium',
            coins_balance: 1000,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'mock-2',
            username: 'mike_c',
            full_name: 'Michael Chen',
            avatar_url: 'https://picsum.photos/seed/mike/200/200.jpg',
            bio: 'Tech entrepreneur who enjoys hiking and trying new restaurants. Let\'s explore the city together!',
            age: 32,
            gender: 'male' as const,
            country: 'Kenya',
            city: 'Nairobi',
            languages: ['English', 'Swahili'],
            interests: ['Technology', 'Hiking', 'Food', 'Startups'],
            relationship_intention: 'serious_only',
            verification_level: 'premium',
            is_verified: true,
            is_premium: true,
            vip_tier: 'premium',
            coins_balance: 1500,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'mock-3',
            username: 'amina_h',
            full_name: 'Amina Hassan',
            avatar_url: 'https://picsum.photos/seed/amina/200/200.jpg',
            bio: 'Artist and yoga instructor. Seeking meaningful connections with creative souls.',
            age: 26,
            gender: 'female' as const,
            country: 'Tanzania',
            city: 'Dar es Salaam',
            languages: ['English', 'Swahili'],
            interests: ['Art', 'Yoga', 'Meditation', 'Dance'],
            relationship_intention: 'friends_first',
            verification_level: 'basic',
            is_verified: false,
            is_premium: false,
            vip_tier: 'free',
            coins_balance: 500,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
      }
      const processedProfiles = newProfiles
        .filter(p => p.id !== user?.id)
        .map(p => ({
          ...p,
          distance: calculateDistance(p, userLocation),
          is_online: p.last_active ? Date.now() - new Date(p.last_active).getTime() < 5 * 60 * 1000 : false
        }));

      setProfiles(prev => reset ? processedProfiles : [...prev, ...processedProfiles]);
      setTotalCount(result.total || newProfiles.length || 0);
      setHasMore(processedProfiles.length === 20);
      setError(null);
    } catch (err) {
      console.error('Error fetching profiles:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch profiles');
      toast({
        title: "Error",
        description: "Failed to load profiles. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [user, userLocation, filters, searchDebounced, toast]);

  // Initial load
  useEffect(() => {
    fetchProfiles(1, true);
  }, [fetchProfiles]);

  // Reset when filters change
  useEffect(() => {
    setPage(1);
    fetchProfiles(1, true);
  }, [
    filters.ageRange,
    filters.maxDistance,
    filters.selectedInterests,
    filters.showVerifiedOnly,
    filters.genderPreference,
    filters.relationshipIntentions,
    filters.sortBy,
    filters.hasPhotos,
    searchDebounced
  ]);

  // Infinite scroll
  useEffect(() => {
    if (loading || loadingMore || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [loading, loadingMore, hasMore]);

  // Load more when page changes
  useEffect(() => {
    if (page > 1) {
      fetchProfiles(page);
    }
  }, [page, fetchProfiles]);

  // Handle swipe actions
  const handleSwipe = useCallback(async (profileId: string, action: 'like' | 'pass' | 'super_like') => {
    if (!user) return;

    try {
      // Update local state
      if (action === 'like') {
        setLikedProfiles(prev => new Set(prev).add(profileId));
      } else if (action === 'pass') {
        setPassedProfiles(prev => new Set(prev).add(profileId));
      }

      // Remove from current view
      setProfiles(prev => prev.filter(p => p.id !== profileId));

      // Save to swipe history
      setSwipeHistory(prev => [
        ...prev,
        { profileId, action, timestamp: Date.now() }
      ]);

      // Check for match if liking
      if (action === 'like' || action === 'super_like') {
        // Check if the other user has already liked this profile
        const hasLike = swipeHistory.some(
          s => s.profileId === user.id && s.action === 'like'
        );

        if (hasLike) {
          // It's a match!
          toast({
            title: "It's a Match! 🎉",
            description: "You can now start chatting",
            action: (
              <Button onClick={() => navigate('/messages')} size="sm">
                Say Hi
              </Button>
            )
          });
        }
      }

      // Save to database
      await fetch('/api/swipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          profileId,
          action
        })
      });

    } catch (error) {
      console.error('Error recording swipe:', error);
      toast({
        title: "Error",
        description: "Failed to record your action. Please try again.",
        variant: "destructive"
      });
      
      // Revert local state
      if (action === 'like') {
        setLikedProfiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(profileId);
          return newSet;
        });
      } else if (action === 'pass') {
        setPassedProfiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(profileId);
          return newSet;
        });
      }
    }
  }, [user, navigate, toast, swipeHistory, setSwipeHistory]);

  // Filter handlers
  const updateFilter = useCallback(<K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      ageRange: [18, 80],
      maxDistance: 50,
      selectedInterests: [],
      showVerifiedOnly: false,
      genderPreference: 'all',
      relationshipIntentions: [],
      sortBy: 'match_percentage',
      hasPhotos: false
    });
    setSearchQuery('');
  }, []);

  // Get all available interests
  const allInterests = useMemo(() => {
    const interests = new Set<string>();
    profiles.forEach(profile => {
      profile.interests?.forEach(interest => interests.add(interest));
    });
    return Array.from(interests).sort();
  }, [profiles]);

  // Filter count
  const filterCount = useMemo(() => {
    return [
      filters.ageRange[0] !== 18 || filters.ageRange[1] !== 80,
      filters.maxDistance !== 50,
      filters.selectedInterests.length > 0,
      filters.showVerifiedOnly,
      filters.genderPreference !== 'all',
      filters.relationshipIntentions.length > 0,
      filters.hasPhotos
    ].filter(Boolean).length;
  }, [filters]);

  // Sort options
  const sortedProfiles = useMemo(() => {
    const sorted = [...profiles];
    
    switch (filters.sortBy) {
      case 'distance':
        return sorted.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
      case 'age':
        return sorted.sort((a, b) => (a.age || 0) - (b.age || 0));
      case 'recently_active':
        return sorted.sort((a, b) => {
          const aTime = a.last_active ? new Date(a.last_active).getTime() : 0;
          const bTime = b.last_active ? new Date(b.last_active).getTime() : 0;
          return bTime - aTime;
        });
      case 'match_percentage':
        return sorted.sort((a, b) => {
          const aMatch = calculateMatchPercentage(a, user);
          const bMatch = calculateMatchPercentage(b, user);
          return bMatch - aMatch;
        });
      default:
        return sorted;
    }
  }, [profiles, filters.sortBy, user]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      {/* Sticky Header */}
      <div className={cn(
        "sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 transition-all duration-300",
        isKeyboardVisible ? "pt-2" : "pt-4"
      )}>
        <div className="container mx-auto px-4">
          {/* Header Row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => navigate(-1)}
                variant="ghost"
                size="sm"
                className="lg:hidden"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <motion.h1 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent"
              >
                Discover
              </motion.h1>
            </div>
            
            <div className="flex items-center gap-2">
              {/* View Toggle */}
              <div className="hidden sm:flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <Button
                  onClick={() => setViewMode('grid')}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-8 h-8 p-0",
                    viewMode === 'grid' && "bg-white dark:bg-gray-700 shadow-sm"
                  )}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => setViewMode('list')}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-8 h-8 p-0",
                    viewMode === 'list' && "bg-white dark:bg-gray-700 shadow-sm"
                  )}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Filter Button */}
              <Button
                onClick={() => setShowFilters(true)}
                size="sm"
                className="relative touch-target"
                variant="outline"
              >
                <Filter className="w-4 h-4" />
                {filterCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center px-1 shadow-lg">
                    {filterCount}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name, location, or interests..."
              className="pl-10 pr-10 touch-target h-11"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <QuickFilterBar filters={filters} onFilterChange={updateFilter} />

          {/* Active Filters */}
          {filterCount > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap gap-2 pb-4"
            >
              {filters.ageRange[0] !== 18 || filters.ageRange[1] !== 80 ? (
                <Badge variant="secondary" className="gap-1 pl-2 pr-1 py-1">
                  Age: {filters.ageRange[0]}-{filters.ageRange[1]}
                  <button onClick={() => updateFilter('ageRange', [18, 80])}>
                    <X className="w-3 h-3 ml-1 hover:text-rose-500" />
                  </button>
                </Badge>
              ) : null}
              
              {filters.maxDistance !== 50 ? (
                <Badge variant="secondary" className="gap-1 pl-2 pr-1 py-1">
                  ≤{filters.maxDistance}km
                  <button onClick={() => updateFilter('maxDistance', 50)}>
                    <X className="w-3 h-3 ml-1 hover:text-rose-500" />
                  </button>
                </Badge>
              ) : null}
              
              {filters.selectedInterests.map(interest => (
                <Badge key={interest} variant="secondary" className="gap-1 pl-2 pr-1 py-1">
                  {interest}
                  <button onClick={() => updateFilter('selectedInterests', 
                    filters.selectedInterests.filter(i => i !== interest)
                  )}>
                    <X className="w-3 h-3 ml-1 hover:text-rose-500" />
                  </button>
                </Badge>
              ))}
              
              {filters.showVerifiedOnly && (
                <Badge variant="secondary" className="gap-1 pl-2 pr-1 py-1">
                  Verified only
                  <button onClick={() => updateFilter('showVerifiedOnly', false)}>
                    <X className="w-3 h-3 ml-1 hover:text-rose-500" />
                  </button>
                </Badge>
              )}
              
              {filters.genderPreference !== 'all' && (
                <Badge variant="secondary" className="gap-1 pl-2 pr-1 py-1">
                  {filters.genderPreference}
                  <button onClick={() => updateFilter('genderPreference', 'all')}>
                    <X className="w-3 h-3 ml-1 hover:text-rose-500" />
                  </button>
                </Badge>
              )}
              
              {filters.hasPhotos && (
                <Badge variant="secondary" className="gap-1 pl-2 pr-1 py-1">
                  Has photos
                  <button onClick={() => updateFilter('hasPhotos', false)}>
                    <X className="w-3 h-3 ml-1 hover:text-rose-500" />
                  </button>
                </Badge>
              )}

              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters} 
                className="text-xs h-7 px-2"
              >
                Clear all
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Filters Bottom Sheet */}
      <BottomSheet 
        open={showFilters} 
        onClose={() => setShowFilters(false)}
        title="Filters"
      >
        <div className="p-4 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Sort By */}
          <div>
            <label className="text-sm font-medium mb-3 block">Sort By</label>
            <div className="grid grid-cols-2 gap-2">
              {SORT_OPTIONS.map(option => {
                const Icon = option.icon;
                return (
                  <Button
                    key={option.value}
                    variant={filters.sortBy === option.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilter('sortBy', option.value as any)}
                    className={cn(
                      "justify-start",
                      filters.sortBy === option.value && "bg-gradient-to-r from-rose-500 to-purple-500 text-white"
                    )}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {option.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Age Range */}
          <div>
            <label className="text-sm font-medium mb-3 block">Age Range</label>
            <div className="px-2">
              <Slider
                value={filters.ageRange}
                onValueChange={(value) => updateFilter('ageRange', value as [number, number])}
                min={18}
                max={80}
                step={1}
                className="mb-2"
              />
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>{filters.ageRange[0]}</span>
                <span>{filters.ageRange[1]}</span>
              </div>
            </div>
          </div>

          {/* Distance */}
          <div>
            <label className="text-sm font-medium mb-3 block">Maximum Distance</label>
            <div className="px-2">
              <Slider
                value={[filters.maxDistance]}
                onValueChange={(value) => updateFilter('maxDistance', value[0])}
                min={1}
                max={200}
                step={1}
                className="mb-2"
              />
              <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                ≤{filters.maxDistance} km
              </div>
            </div>
          </div>

          {/* Gender Preference */}
          <div>
            <label className="text-sm font-medium mb-3 block">Show</label>
            <RadioGroup
              value={filters.genderPreference}
              onValueChange={(value) => updateFilter('genderPreference', value as any)}
              className="grid grid-cols-2 gap-2"
            >
              {['all', 'male', 'female', 'other'].map(gender => (
                <div key={gender} className="flex items-center space-x-2">
                  <RadioGroupItem value={gender} id={`gender-${gender}`} />
                  <label htmlFor={`gender-${gender}`} className="text-sm capitalize">
                    {gender}
                  </label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Relationship Intentions */}
          <div>
            <label className="text-sm font-medium mb-3 block">Looking For</label>
            <div className="space-y-2">
              {RELATIONSHIP_INTENTIONS.map(intention => {
                const Icon = intention.icon;
                return (
                  <div key={intention.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={intention.value}
                      checked={filters.relationshipIntentions.includes(intention.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          updateFilter('relationshipIntentions', 
                            [...filters.relationshipIntentions, intention.value]
                          );
                        } else {
                          updateFilter('relationshipIntentions',
                            filters.relationshipIntentions.filter(i => i !== intention.value)
                          );
                        }
                      }}
                    />
                    <label htmlFor={intention.value} className="text-sm flex items-center gap-2 cursor-pointer">
                      <Icon className="w-4 h-4" />
                      {intention.label}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interests */}
          {allInterests.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-3 block">Interests</label>
              <div className="flex flex-wrap gap-2">
                {allInterests.map(interest => (
                  <FilterChip
                    key={interest}
                    label={interest}
                    active={filters.selectedInterests.includes(interest)}
                    onClick={() => {
                      if (filters.selectedInterests.includes(interest)) {
                        updateFilter('selectedInterests',
                          filters.selectedInterests.filter(i => i !== interest)
                        );
                      } else {
                        updateFilter('selectedInterests',
                          [...filters.selectedInterests, interest]
                        );
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Additional Filters */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="verified"
                checked={filters.showVerifiedOnly}
                onCheckedChange={(checked) => updateFilter('showVerifiedOnly', checked as boolean)}
              />
              <label htmlFor="verified" className="text-sm flex items-center gap-2 cursor-pointer">
                <Shield className="w-4 h-4" />
                Show verified profiles only
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="photos"
                checked={filters.hasPhotos}
                onCheckedChange={(checked) => updateFilter('hasPhotos', checked as boolean)}
              />
              <label htmlFor="photos" className="text-sm flex items-center gap-2 cursor-pointer">
                <Camera className="w-4 h-4" />
                Only show profiles with photos
              </label>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={clearFilters}>
              Clear All
            </Button>
            <Button 
              className="flex-1 bg-gradient-to-r from-rose-500 to-purple-500 text-white"
              onClick={() => setShowFilters(false)}
            >
              Show {totalCount} Results
            </Button>
          </div>
        </div>
      </BottomSheet>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Results Count */}
        {!loading && !error && profiles.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between mb-4"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {totalCount} {totalCount === 1 ? 'person' : 'people'} found
            </p>
            <Badge variant="outline" className="text-xs">
              Page {page} of {Math.ceil(totalCount / 20)}
            </Badge>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <ProfileSkeleton key={i} variant={viewMode} />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <EmptyState
            title="Something went wrong"
            description={error}
            icon={<Search className="w-8 h-8 text-red-500" />}
            action={{ label: "Try Again", onClick: () => fetchProfiles(1, true) }}
          />
        )}

        {/* Results */}
        {!loading && !error && (
          <>
            {profiles.length > 0 ? (
              <div className={cn(
                "grid gap-4",
                viewMode === 'grid' 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                  : 'grid-cols-1'
              )}>
                {sortedProfiles.map((profile, index) => (
                  <motion.div
                    key={profile.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ResponsiveProfileCard
                      profile={{
                        ...profile,
                        location: profile.city && profile.country 
                          ? `${profile.city}, ${profile.country}`
                          : profile.country || 'Location unknown',
                        photos: profile.photos || (profile.avatar_url ? [profile.avatar_url] : []),
                        match_percentage: calculateMatchPercentage(profile, user),
                        is_liked: likedProfiles.has(profile.id),
                        is_passed: passedProfiles.has(profile.id),
                        last_active_formatted: formatLastActive(profile.last_active)
                      }}
                      variant={viewMode === 'list' ? 'horizontal' : 'vertical'}
                      onLike={() => handleSwipe(profile.id, 'like')}
                      onPass={() => handleSwipe(profile.id, 'pass')}
                      onSuperLike={() => handleSwipe(profile.id, 'super_like')}
                      onClick={() => navigate(`/profile/${profile.id}`)}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No profiles found"
                description="Try adjusting your filters or search terms to see more people."
                icon={<Users className="w-8 h-8 text-gray-400" />}
                action={{ label: "Clear Filters", onClick: clearFilters }}
              />
            )}
          </>
        )}

        {/* Loading More */}
        {loadingMore && (
          <div className="flex justify-center py-8">
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading more...</span>
            </div>
          </div>
        )}

        {/* Infinite Scroll Trigger */}
        <div ref={loadMoreRef} className="h-4" />

        {/* No More Results */}
        {!hasMore && profiles.length > 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>You've reached the end</p>
            <Button 
              variant="link" 
              onClick={clearFilters}
              className="text-rose-500"
            >
              Try changing your filters
            </Button>
          </div>
        )}
      </div>

      {/* Quick Action Bar (Mobile) */}
      {profiles.length > 0 && (
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 p-4 lg:hidden"
        >
          <div className="flex items-center justify-center gap-3 max-w-md mx-auto">
            <Button
              onClick={() => {/* Quick action */}}
              size="lg"
              variant="outline"
              className="w-14 h-14 rounded-full border-2 border-rose-200 dark:border-rose-800"
            >
              <RefreshCw className="w-6 h-6 text-rose-500" />
            </Button>
            <Button
              onClick={() => handleSwipe(profiles[0]?.id, 'pass')}
              size="lg"
              className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300"
            >
              <X className="w-6 h-6" />
            </Button>
            <Button
              onClick={() => handleSwipe(profiles[0]?.id, 'like')}
              size="lg"
              className="w-14 h-14 rounded-full bg-gradient-to-r from-rose-500 to-purple-500 text-white"
            >
              <Heart className="w-6 h-6" />
            </Button>
            <Button
              onClick={() => handleSwipe(profiles[0]?.id, 'super_like')}
              size="lg"
              variant="outline"
              className="w-14 h-14 rounded-full border-2 border-purple-200 dark:border-purple-800"
            >
              <Sparkles className="w-6 h-6 text-purple-500" />
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default DiscoverPage;