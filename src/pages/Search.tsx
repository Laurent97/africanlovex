import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  Users, 
  Heart, 
  Star, 
  Shield,
  ChevronDown,
  X,
  Sliders,
  User,
  Globe,
  Compass,
  Sparkles,
  Eye,
  Clock,
  CheckCircle,
  RefreshCw,
  Crown,
  ChevronRight,
  UserCircle,
  UserPlus,
  UsersRound,
  HeartPulse,
  Gem,
  Infinity,
  Sparkle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UserProfile {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  location: string;
  city: string;
  country: string;
  bio: string;
  occupation: string;
  avatar: string;
  photos: string[];
  interests: string[];
  verified: boolean;
  verificationLevel: string;
  distance: number;
  lastActive: string;
  languages: string[];
  relationshipIntention: string;
  relationshipIntentionLabel: string;
  vipTier: string;
  matchPercentage?: number;
  isOnline?: boolean;
}

const Discover = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'distance' | 'newest' | 'online' | 'verified' | 'match'>('match');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  
  // Gender filter - New addition
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female' | 'other'>('all');
  
  // Filter states
  const [ageRange, setAgeRange] = useState([18, 50]);
  const [maxDistance, setMaxDistance] = useState([50]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [relationshipIntention, setRelationshipIntention] = useState<string>('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [vipOnly, setVipOnly] = useState(false);
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  // Real search results from database
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);

  // Load search results from database
  useEffect(() => {
    loadSearchResults();
  }, [user, ageRange, maxDistance, selectedInterests, relationshipIntention, verifiedOnly, onlineOnly, vipOnly, genderFilter]);

  // Update active filter count
  useEffect(() => {
    let count = 0;
    if (ageRange[0] !== 18 || ageRange[1] !== 50) count++;
    if (maxDistance[0] !== 50) count++;
    if (selectedInterests.length > 0) count++;
    if (relationshipIntention !== 'all') count++;
    if (verifiedOnly) count++;
    if (onlineOnly) count++;
    if (vipOnly) count++;
    if (genderFilter !== 'all') count++;
    setActiveFilterCount(count);
  }, [ageRange, maxDistance, selectedInterests, relationshipIntention, verifiedOnly, onlineOnly, vipOnly, genderFilter]);

  const loadSearchResults = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get current user's profile to calculate distances and matches
      const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // Query other profiles
      let query = supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id);

      // Apply gender filter
      if (genderFilter !== 'all') {
        query = query.eq('gender', genderFilter);
      }

      // Apply age filters
      if (ageRange[0] > 18 || ageRange[1] < 50) {
        query = query.gte('age', ageRange[0]).lte('age', ageRange[1]);
      }

      // Apply verification filter
      if (verifiedOnly) {
        query = query.eq('is_verified', true);
      }

      // Apply VIP filter
      if (vipOnly) {
        query = query.in('vip_tier', ['premium', 'platinum', 'diamond']);
      }

      const { data: profiles, error } = await query;

      if (error) throw error;

      // Transform data to match UserProfile interface
      const transformedProfiles: UserProfile[] = (profiles || []).map(profile => ({
        id: profile.id,
        name: profile.full_name || 'Anonymous',
        age: profile.age || 25,
        gender: profile.gender || 'other',
        location: profile.location || 'Unknown',
        city: profile.city || 'Unknown',
        country: profile.country || 'Unknown',
        bio: profile.bio || 'No bio available',
        occupation: profile.occupation || 'Unknown',
        avatar: profile.avatar_url || '',
        photos: profile.photos || [],
        interests: profile.interests || [],
        verified: profile.is_verified || false,
        verificationLevel: profile.verification_level || 'basic',
        distance: calculateDistance(currentUserProfile, profile),
        lastActive: formatLastActive(profile.last_active),
        languages: profile.languages || [],
        relationshipIntention: profile.relationship_intention || 'open_to_all',
        relationshipIntentionLabel: getRelationshipIntentionLabel(profile.relationship_intention),
        vipTier: profile.vip_tier || 'free',
        matchPercentage: calculateMatchPercentage(currentUserProfile, profile),
        isOnline: isUserOnline(profile.last_active)
      }));

      setSearchResults(transformedProfiles);
    } catch (error) {
      console.error('Error loading search results:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const calculateDistance = (user1: any, user2: any): number => {
    // Simple distance calculation - in real app, use geolocation
    if (!user1?.location || !user2?.location) return Math.floor(Math.random() * 100);
    return Math.floor(Math.random() * 100);
  };

  const formatLastActive = (lastActive: string): string => {
    if (!lastActive) return 'Unknown';
    const date = new Date(lastActive);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Online now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffHours < 168) return `${Math.floor(diffHours / 24)} days ago`;
    return `${Math.floor(diffHours / 168)} weeks ago`;
  };

  const isUserOnline = (lastActive: string): boolean => {
    if (!lastActive) return false;
    const date = new Date(lastActive);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return diffMinutes < 30;
  };

  const getRelationshipIntentionLabel = (intention: string): string => {
    const labels: Record<string, string> = {
      'serious_only': 'Serious Relationship 💍',
      'looking_for_love': 'Looking for Love 💕',
      'friends_first': 'Friends First 🤝',
      'open_to_all': 'Open to All 🌟',
      'casual_dating': 'Casual Dating ☕',
      'marriage_minded': 'Marriage Minded 💒',
      'life_partner': 'Life Partner 👰'
    };
    return labels[intention] || 'Open to All 🌟';
  };

  const calculateMatchPercentage = (user1: any, user2: any): number => {
    // Simple match calculation - in real app, use sophisticated algorithm
    if (!user1 || !user2) return Math.floor(Math.random() * 40) + 50;
    
    let score = 50; // Base score
    
    // Add points for common interests
    const user1Interests = user1.interests || [];
    const user2Interests = user2.interests || [];
    const commonInterests = user1Interests.filter((interest: string) => 
      user2Interests.includes(interest)
    ).length;
    score += commonInterests * 5;
    
    // Add points for same relationship intention
    if (user1.relationship_intention === user2.relationship_intention) {
      score += 15;
    }
    
    // Add points for age proximity
    const ageDiff = Math.abs((user1.age || 25) - (user2.age || 25));
    if (ageDiff <= 5) score += 10;
    else if (ageDiff <= 10) score += 5;
    
    return Math.min(score, 99);
  };

  const interests = [
    'Travel', 'Music', 'Coffee', 'Photography', 'Reading', 'Cooking',
    'Fitness', 'Art', 'Technology', 'Nature', 'Gaming', 'Movies',
    'Dancing', 'Writing', 'Sports', 'Fashion', 'Science', 'Hiking',
    'Swimming', 'Yoga', 'Meditation', 'Business', 'Education', 'Food',
    'Wine', 'Poetry', 'Theatre', 'Volunteering', 'Pets', 'Gardening'
  ];

  const relationshipIntentions = [
    { value: 'all', label: 'All Intentions', icon: '❤️' },
    { value: 'looking_for_love', label: 'Looking for Love', icon: '💕' },
    { value: 'serious_only', label: 'Serious Only', icon: '💍' },
    { value: 'marriage_minded', label: 'Marriage Minded', icon: '💒' },
    { value: 'life_partner', label: 'Life Partner', icon: '👰' },
    { value: 'friends_first', label: 'Friends First', icon: '🤝' },
    { value: 'casual_dating', label: 'Casual Dating', icon: '😊' }
  ];

  const sortOptions = [
    { value: 'match', label: 'Best Match', icon: <Star className="w-4 h-4" /> },
    { value: 'distance', label: 'Nearest', icon: <MapPin className="w-4 h-4" /> },
    { value: 'newest', label: 'Newest', icon: <Clock className="w-4 h-4" /> },
    { value: 'online', label: 'Online Now', icon: <Users className="w-4 h-4" /> },
    { value: 'verified', label: 'Verified', icon: <Shield className="w-4 h-4" /> }
  ];

  const genderOptions = [
    { value: 'all', label: 'Everyone', icon: <UsersRound className="w-4 h-4" /> },
    { value: 'female', label: 'Women', icon: <UserCircle className="w-4 h-4" /> },
    { value: 'male', label: 'Men', icon: <User className="w-4 h-4" /> },
    { value: 'other', label: 'Non-binary', icon: <UserPlus className="w-4 h-4" /> }
  ];

  // Filter results
  const filteredResults = searchResults.filter(profile => {
    const matchesSearch = searchQuery === '' ||
                         profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         profile.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         profile.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         profile.occupation.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesAge = profile.age >= ageRange[0] && profile.age <= ageRange[1];
    const matchesDistance = profile.distance <= maxDistance[0];
    const matchesInterests = selectedInterests.length === 0 || 
                           selectedInterests.some(interest => profile.interests.includes(interest));
    const matchesRelationship = relationshipIntention === 'all' || 
                                profile.relationshipIntention === relationshipIntention;
    const matchesVerified = !verifiedOnly || profile.verified;
    const matchesOnline = !onlineOnly || profile.isOnline;
    const matchesVip = !vipOnly || profile.vipTier !== 'free';

    return matchesSearch && matchesAge && matchesDistance && matchesInterests && 
           matchesRelationship && matchesVerified && matchesOnline && matchesVip;
  });

  const sortedResults = [...filteredResults].sort((a, b) => {
    switch (sortBy) {
      case 'match':
        return (b.matchPercentage || 0) - (a.matchPercentage || 0);
      case 'distance':
        return a.distance - b.distance;
      case 'newest':
        return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
      case 'online':
        return (b.isOnline ? 1 : 0) - (a.isOnline ? 1 : 0);
      case 'verified':
        return (b.verified ? 1 : 0) - (a.verified ? 1 : 0);
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-b from-white to-rose-50 dark:from-gray-900 dark:to-rose-950/20 flex items-center justify-center">
          <div className="text-center">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mx-auto mb-6"></div>
              <Heart className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-rose-500 animate-pulse" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">Discovering amazing people for you...</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">This may take a moment</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests(prev => {
      const newInterests = prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest];
      return newInterests;
    });
  };

  const clearFilters = () => {
    setAgeRange([18, 50]);
    setMaxDistance([50]);
    setSelectedInterests([]);
    setRelationshipIntention('all');
    setVerifiedOnly(false);
    setOnlineOnly(false);
    setVipOnly(false);
    setGenderFilter('all');
    setSearchQuery('');
  };

  const getMatchPercentageColor = (percentage: number) => {
    if (percentage >= 90) return '#10B981'; // Green
    if (percentage >= 80) return '#3B82F6'; // Blue
    if (percentage >= 70) return '#8B5CF6'; // Purple
    return '#EC4899'; // Pink
  };

  const getCountryFlag = (country: string) => {
    const flags: Record<string, string> = {
      'Rwanda': '🇷🇼',
      'Kenya': '🇰🇪',
      'Uganda': '🇺🇬',
      'Tanzania': '🇹🇿',
      'Burundi': '🇧🇮',
      'Congo': '🇨🇩',
      'Nigeria': '🇳🇬',
      'South Africa': '🇿🇦',
      'Ethiopia': '🇪🇹',
      'Egypt': '🇪🇬'
    };
    return flags[country] || '🌍';
  };

  const getGenderIcon = (gender: string) => {
    switch(gender) {
      case 'male': return <User className="w-3 h-3" />;
      case 'female': return <UserCircle className="w-3 h-3" />;
      default: return <UserPlus className="w-3 h-3" />;
    }
  };

  if (!user) return null;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white dark:from-gray-900 dark:to-rose-950/10">
        {/* Floating Hearts Background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-rose-200/20 dark:text-rose-500/10"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                x: [0, 15, -15, 0],
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 15 + i * 5,
                repeat: Infinity,
                delay: i * 2,
              }}
            >
              <Heart className="w-12 h-12" />
            </motion.div>
          ))}
        </div>

        {/* Hero Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600">
          <div className="absolute inset-0">
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 10 L35 25 L50 25 L38 35 L42 50 L30 40 L18 50 L22 35 L10 25 L25 25 Z' fill='rgba(255,255,255,0.1)' /%3E%3C/svg%3E")`
            }} />
          </div>

          <div className="relative z-10 container mx-auto px-4 sm:px-6 py-8 md:py-12">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
                    <Compass className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-2 font-display">
                      Discover
                      <Sparkle className="w-6 h-6 text-yellow-300" />
                    </h1>
                    <p className="text-white/80 text-sm flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      Find your perfect match across East Africa
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-wrap gap-3"
              >
                <Button
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  variant="outline"
                  size="sm"
                  className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
                >
                  <Sliders className="w-4 h-4 mr-2" />
                  {viewMode === 'grid' ? 'List View' : 'Grid View'}
                </Button>
                <Link to="/matching">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Swipe View
                  </Button>
                </Link>
              </motion.div>
            </div>

            {/* Search Bar */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-6 max-w-2xl"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search by name, location, occupation, or interests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-6 text-lg rounded-full border-0 shadow-xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm"
                />
                {searchQuery && (
                  <Button
                    onClick={() => setSearchQuery('')}
                    variant="ghost"
                    size="sm"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Filters Sidebar - Desktop */}
            <div className="hidden lg:block lg:col-span-1">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="sticky top-24"
              >
                <Card className="border-0 shadow-xl overflow-hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-rose-500" />
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                          Filters
                        </h3>
                        {activeFilterCount > 0 && (
                          <Badge className="ml-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white border-0">
                            {activeFilterCount}
                          </Badge>
                        )}
                      </div>
                      <Button
                        onClick={clearFilters}
                        variant="ghost"
                        size="sm"
                        className="text-sm text-gray-500 hover:text-rose-500"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Clear
                      </Button>
                    </div>

                    {/* Gender Filter */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        <span className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Interested In
                        </span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {genderOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setGenderFilter(option.value as any)}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all ${
                              genderFilter === option.value
                                ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                          >
                            {option.icon}
                            <span>{option.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sort By */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Sort By
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {sortOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setSortBy(option.value as any)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                              sortBy === option.value
                                ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                          >
                            {option.icon}
                            <span className="truncate">{option.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Age Range */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        <span className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Age Range: <span className="text-rose-500 font-semibold ml-1">{ageRange[0]} - {ageRange[1]}</span>
                        </span>
                      </label>
                      <Slider
                        value={ageRange}
                        onValueChange={setAgeRange}
                        max={80}
                        min={18}
                        step={1}
                        className="w-full [&_.slider-track]:bg-gray-200 [&_.slider-range]:bg-gradient-to-r [&_.slider-range]:from-rose-500 [&_.slider-range]:to-pink-500"
                      />
                    </div>

                    {/* Distance */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        <span className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Max Distance: <span className="text-rose-500 font-semibold ml-1">{maxDistance[0]} km</span>
                        </span>
                      </label>
                      <Slider
                        value={maxDistance}
                        onValueChange={setMaxDistance}
                        max={200}
                        min={1}
                        step={1}
                        className="w-full [&_.slider-track]:bg-gray-200 [&_.slider-range]:bg-gradient-to-r [&_.slider-range]:from-rose-500 [&_.slider-range]:to-pink-500"
                      />
                    </div>

                    {/* Relationship Intention */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        <span className="flex items-center gap-2">
                          <HeartPulse className="w-4 h-4" />
                          Relationship Intention
                        </span>
                      </label>
                      <Select value={relationshipIntention} onValueChange={setRelationshipIntention}>
                        <SelectTrigger className="w-full bg-gray-100 dark:bg-gray-800 border-0">
                          <SelectValue placeholder="Select intention" />
                        </SelectTrigger>
                        <SelectContent>
                          {relationshipIntentions.map((intention) => (
                            <SelectItem key={intention.value} value={intention.value}>
                              <span className="flex items-center gap-2">
                                <span>{intention.icon}</span>
                                <span>{intention.label}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Interests */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        <span className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          Interests
                        </span>
                      </label>
                      <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
                        {interests.map((interest) => (
                          <button
                            key={interest}
                            onClick={() => handleInterestToggle(interest)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                              selectedInterests.includes(interest)
                                ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md scale-105'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                          >
                            {interest}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quick Filters */}
                    <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={verifiedOnly}
                          onChange={(e) => setVerifiedOnly(e.target.checked)}
                          className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500"
                        />
                        <span className="text-sm flex-1 text-gray-700 dark:text-gray-300">
                          Verified Profiles Only
                        </span>
                        <Shield className="w-4 h-4 text-emerald-500" />
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={onlineOnly}
                          onChange={(e) => setOnlineOnly(e.target.checked)}
                          className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500"
                        />
                        <span className="text-sm flex-1 text-gray-700 dark:text-gray-300">
                          Online Now
                        </span>
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={vipOnly}
                          onChange={(e) => setVipOnly(e.target.checked)}
                          className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500"
                        />
                        <span className="text-sm flex-1 text-gray-700 dark:text-gray-300">
                          VIP Members
                        </span>
                        <Crown className="w-4 h-4 text-amber-500" />
                      </label>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Mobile Filter Button */}
            <div className="lg:hidden mb-6">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                className="w-full rounded-full py-6 bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg hover:from-rose-600 hover:to-pink-600"
              >
                <Filter className="w-5 h-5 mr-2" />
                Filters {activeFilterCount > 0 && `(${activeFilterCount} active)`}
                <ChevronDown className={`w-5 h-5 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </Button>
            </div>

            {/* Mobile Filters Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="lg:hidden overflow-hidden"
                >
                  <Card className="border-0 shadow-xl mb-6 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
                    <CardContent className="p-6">
                      {/* Mobile Filter Content - Same as desktop but optimized */}
                      <div className="space-y-6">
                        {/* Gender Filter */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Interested In
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {genderOptions.map((option) => (
                              <button
                                key={option.value}
                                onClick={() => setGenderFilter(option.value as any)}
                                className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-sm transition-all ${
                                  genderFilter === option.value
                                    ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                }`}
                              >
                                {option.icon}
                                <span>{option.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Sort By */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Sort By
                          </label>
                          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                            <SelectTrigger className="w-full bg-gray-100 dark:bg-gray-800 border-0">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {sortOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  <span className="flex items-center gap-2">
                                    {option.icon}
                                    {option.label}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Age Range */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Age: {ageRange[0]} - {ageRange[1]}
                          </label>
                          <Slider
                            value={ageRange}
                            onValueChange={setAgeRange}
                            max={80}
                            min={18}
                            step={1}
                            className="w-full"
                          />
                        </div>

                        {/* Distance */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Max Distance: {maxDistance[0]} km
                          </label>
                          <Slider
                            value={maxDistance}
                            onValueChange={setMaxDistance}
                            max={200}
                            min={1}
                            step={1}
                            className="w-full"
                          />
                        </div>

                        {/* Relationship Intention */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Relationship Intention
                          </label>
                          <Select value={relationshipIntention} onValueChange={setRelationshipIntention}>
                            <SelectTrigger className="w-full bg-gray-100 dark:bg-gray-800 border-0">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {relationshipIntentions.map((intention) => (
                                <SelectItem key={intention.value} value={intention.value}>
                                  {intention.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Quick Filters */}
                        <div className="space-y-3">
                          <label className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={verifiedOnly}
                              onChange={(e) => setVerifiedOnly(e.target.checked)}
                              className="w-4 h-4 rounded text-rose-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              Verified Only
                            </span>
                          </label>
                          <label className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={onlineOnly}
                              onChange={(e) => setOnlineOnly(e.target.checked)}
                              className="w-4 h-4 rounded text-rose-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              Online Now
                            </span>
                          </label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results */}
            <div className="lg:col-span-3">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {/* Results Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      <span className="text-rose-500">{sortedResults.length}</span> Results Found
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {sortedResults.length} people match your criteria
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="px-3 py-1">
                      <Eye className="w-3 h-3 mr-1" />
                      {sortedResults.length} showing
                    </Badge>
                  </div>
                </div>

                {/* Results Grid/List */}
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {sortedResults.map((profile, index) => (
                      <motion.div
                        key={profile.id}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        whileHover={{ y: -5 }}
                      >
                        <Link to={`/profile/${profile.id}`}>
                          <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
                            <CardContent className="p-0">
                              {/* Card Header with Image */}
                              <div className="relative h-48 overflow-hidden">
                                <img
                                  src={profile.photos[0] || profile.avatar}
                                  alt={profile.name}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                
                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                                
                                {/* Match Percentage Badge */}
                                {profile.matchPercentage && (
                                  <div className="absolute top-2 right-2">
                                    <div 
                                      className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg border-2 border-white"
                                      style={{ backgroundColor: getMatchPercentageColor(profile.matchPercentage) }}
                                    >
                                      {profile.matchPercentage}%
                                    </div>
                                  </div>
                                )}

                                {/* VIP Badge */}
                                {profile.vipTier !== 'free' && (
                                  <div className="absolute top-2 left-2">
                                    <Badge className="px-2 py-1 text-xs flex items-center gap-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0">
                                      <Crown className="w-3 h-3" />
                                      {profile.vipTier}
                                    </Badge>
                                  </div>
                                )}

                                {/* Online Indicator */}
                                {profile.isOnline && (
                                  <div className="absolute bottom-2 left-2 flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-xs text-white">Online</span>
                                  </div>
                                )}

                                {/* Country Flag */}
                                <div className="absolute bottom-2 right-2 text-2xl drop-shadow-lg">
                                  {getCountryFlag(profile.country)}
                                </div>

                                {/* Gender Icon */}
                                <div className="absolute top-2 right-14">
                                  <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                                    {getGenderIcon(profile.gender)}
                                  </div>
                                </div>
                              </div>

                              {/* Card Body */}
                              <div className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                                      {profile.name}, {profile.age}
                                    </h3>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                      <MapPin className="w-3 h-3" />
                                      <span>{profile.city}</span>
                                      <span>•</span>
                                      <span>{profile.distance} km</span>
                                    </div>
                                  </div>
                                  {profile.verified && (
                                    <Shield className="w-4 h-4 text-emerald-500" />
                                  )}
                                </div>

                                {/* Occupation */}
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                  {profile.occupation}
                                </p>

                                {/* Interests */}
                                <div className="flex flex-wrap gap-1 mb-3">
                                  {profile.interests.slice(0, 3).map((interest, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-0">
                                      {interest}
                                    </Badge>
                                  ))}
                                  {profile.interests.length > 3 && (
                                    <Badge variant="secondary" className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-0">
                                      +{profile.interests.length - 3}
                                    </Badge>
                                  )}
                                </div>

                                {/* Relationship Intention */}
                                <Badge className="text-xs bg-gradient-to-r from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30 text-rose-700 dark:text-rose-300 border-0">
                                  {profile.relationshipIntentionLabel}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sortedResults.map((profile, index) => (
                      <motion.div
                        key={profile.id}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <Link to={`/profile/${profile.id}`}>
                          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
                            <CardContent className="p-4">
                              <div className="flex gap-4">
                                {/* Avatar */}
                                <div className="relative">
                                  <Avatar className="w-20 h-20 ring-2 ring-rose-200 dark:ring-rose-800">
                                    <AvatarImage src={profile.avatar} />
                                    <AvatarFallback className="bg-gradient-to-r from-rose-500 to-pink-500 text-white">
                                      {profile.name[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  {profile.verified && (
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-white dark:border-gray-900">
                                      <Shield className="w-3 h-3 text-white" />
                                    </div>
                                  )}
                                  {profile.isOnline && (
                                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-900 animate-pulse" />
                                  )}
                                  <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-white/90 dark:bg-gray-800 flex items-center justify-center text-xs border border-gray-200 dark:border-gray-700">
                                    {getGenderIcon(profile.gender)}
                                  </div>
                                </div>

                                {/* Info */}
                                <div className="flex-1">
                                  <div className="flex items-start justify-between mb-1">
                                    <div>
                                      <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                                        {profile.name}, {profile.age}
                                      </h3>
                                      <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                                        <div className="flex items-center gap-1">
                                          <MapPin className="w-4 h-4" />
                                          <span>{profile.city}, {getCountryFlag(profile.country)}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Users className="w-4 h-4" />
                                          <span>{profile.distance} km</span>
                                        </div>
                                      </div>
                                    </div>
                                    {profile.matchPercentage && (
                                      <div 
                                        className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg"
                                        style={{ backgroundColor: getMatchPercentageColor(profile.matchPercentage) }}
                                      >
                                        {profile.matchPercentage}%
                                      </div>
                                    )}
                                  </div>

                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                                    {profile.bio}
                                  </p>

                                  <div className="flex items-center gap-2">
                                    <Badge className="text-xs bg-gradient-to-r from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30 text-rose-700 dark:text-rose-300 border-0">
                                      {profile.relationshipIntentionLabel}
                                    </Badge>
                                    {profile.vipTier !== 'free' && (
                                      <Badge className="text-xs flex items-center gap-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0">
                                        <Crown className="w-3 h-3" />
                                        {profile.vipTier}
                                      </Badge>
                                    )}
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      Active {profile.lastActive}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Empty State */}
                {sortedResults.length === 0 && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-center py-16"
                  >
                    <div className="relative mb-8">
                      <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30 flex items-center justify-center">
                        <Search className="w-16 h-16 text-rose-400 dark:text-rose-500" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 flex items-center justify-center">
                        <Heart className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    
                    <h3 className="text-3xl font-bold mb-3 bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                      No Matches Found
                    </h3>
                    
                    <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                      We couldn't find anyone matching your current criteria. Don't worry - your perfect match is out there!
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                      <Button
                        onClick={clearFilters}
                        className="rounded-full px-8 py-3 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-lg"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Clear All Filters
                      </Button>
                      
                      <Button
                        onClick={() => {
                          setSearchQuery('');
                          setAgeRange([18, 50]);
                          setMaxDistance([100]);
                          setSelectedInterests([]);
                          setRelationshipIntention('all');
                          setVerifiedOnly(false);
                          setOnlineOnly(false);
                          setVipOnly(false);
                          setGenderFilter('all');
                        }}
                        variant="outline"
                        className="rounded-full px-8 py-3 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      >
                        <Compass className="w-4 h-4 mr-2" />
                        Expand Search
                      </Button>
                    </div>

                    <div className="mt-8 p-6 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20 rounded-2xl max-w-lg mx-auto">
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-rose-500" />
                        Tips for Better Matches
                      </h4>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 text-left">
                        <li className="flex items-start gap-2">
                          <span className="text-rose-500 mt-1">•</span>
                          <span>Try expanding your search distance to include more cities</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-rose-500 mt-1">•</span>
                          <span>Adjust age range to find more compatible partners</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-rose-500 mt-1">•</span>
                          <span>Be more flexible with interests and relationship intentions</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-rose-500 mt-1">•</span>
                          <span>Check back later - new members join daily!</span>
                        </li>
                      </ul>
                    </div>
                  </motion.div>
                )}

                {/* Load More */}
                {sortedResults.length > 0 && sortedResults.length < searchResults.length && (
                  <div className="text-center mt-8">
                    <Button
                      variant="outline"
                      className="rounded-full px-8 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    >
                      Load More Profiles
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default Discover;