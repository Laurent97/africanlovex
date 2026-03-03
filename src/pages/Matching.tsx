import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Heart, 
  X, 
  Sparkles, 
  Users, 
  MapPin, 
  Calendar, 
  Shield, 
  Star, 
  ChevronRight, 
  Globe, 
  Droplet, 
  Coffee, 
  Sun,
  Compass,
  Zap,
  Award,
  TrendingUp,
  Clock,
  Filter,
  RefreshCw,
  ChevronLeft,
  MessageCircle,
  Gift,
  CheckCircle,
  Crown,
  Diamond,
  Gem,
  Flame,
  Sparkle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

interface PotentialMatch {
  id: string;
  username: string;
  full_name: string;
  age: number;
  city: string;
  country: string;
  bio: string;
  occupation: string;
  avatar_url: string;
  photos?: string[];
  interests: string[];
  is_verified: boolean;
  verification_level: string;
  distance?: number;
  last_active?: string;
  languages: string[];
  relationship_intention: string;
  vip_tier: string;
  match_percentage?: number;
  is_online?: boolean;
}

interface SwipeData {
  userId: string;
  targetUserId: string;
  action: 'like' | 'pass';
}

const MATCH_ICE_BREAKERS = [
  "Hey! I noticed we matched - what's something interesting about yourself that's not in your profile?",
  "Hi there! I'm really glad we matched. What inspired you to join LoveX?",
  "Hello! I'd love to get to know you better. What's your favorite thing about where you live?",
  "Hey! Since we matched, I was wondering - what's the best piece of advice you've ever received?",
  "Hi! I'm excited to connect. What does your perfect weekend look like?",
  "Hello! I saw we share some interests. What's your favorite way to spend free time?",
  "Hey there! If you could travel anywhere in East Africa tomorrow, where would you go?",
  "Hi! What's the most memorable experience you've had recently?",
  "Hello! I'm curious - what's something you're passionate about that most people don't know?",
  "Hey! I thought I'd break the ice - what's the best meal you've had recently?"
];

const MatchingContent = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [matches, setMatches] = useState<PotentialMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedProfiles, setLikedProfiles] = useState<string[]>([]);
  const [passedProfiles, setPassedProfiles] = useState<string[]>([]);
  const [showMatchPopup, setShowMatchPopup] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<PotentialMatch | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterAgeRange, setFilterAgeRange] = useState<[number, number]>([18, 50]);
  const [filterDistance, setFilterDistance] = useState(100);
  const [showOnlyVerified, setShowOnlyVerified] = useState(false);
  const [showOnlyOnline, setShowOnlyOnline] = useState(false);
  const [processingSwipe, setProcessingSwipe] = useState(false);

  const getRandomIceBreaker = useCallback(() => {
    return MATCH_ICE_BREAKERS[Math.floor(Math.random() * MATCH_ICE_BREAKERS.length)];
  }, []);

  const sendMatchMessage = async (matchUserId: string, iceBreaker: string) => {
    try {
      // First, get or create conversation
      const { data: conversationData, error: conversationError } = await supabase
        .rpc('get_or_create_conversation', {
          user1_uuid: user?.id,
          user2_uuid: matchUserId,
          match_uuid: null
        });

      if (conversationError) throw conversationError;

      // Send the ice breaker message
      const { error: messageError } = await supabase
        .rpc('send_message', {
          conversation_uuid: conversationData,
          sender_uuid: user?.id,
          message_content: iceBreaker,
          message_type: 'text'
        });

      if (messageError) throw messageError;

      // Navigate to chat with this conversation
      navigate(`/chat/${matchUserId}?conversation=${conversationData}&newMatch=true`);
    } catch (error) {
      console.error('Error sending match message:', error);
      // Still navigate to chat even if message fails
      navigate(`/chat/${matchUserId}?newMatch=true`);
    }
  };

  useEffect(() => {
    if (user) {
      loadPotentialMatches();
      
      // Set up real-time subscription for new matches
      const matchesSubscription = supabase
        .channel('matches-channel')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'matches',
            filter: `user1_id=eq.${user.id} OR user2_id=eq.${user.id}`
          },
          async (payload) => {
            // When a new match is created, check if it's from a like we just made
            const newMatch = payload.new;
            const matchedUserId = newMatch.user1_id === user.id ? newMatch.user2_id : newMatch.user1_id;
            
            // Get the matched user's profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', matchedUserId)
              .single();

            if (profile) {
              const matchedProfile: PotentialMatch = {
                id: profile.id,
                username: profile.username,
                full_name: profile.full_name || profile.username,
                age: profile.age || 0,
                city: profile.city || '',
                country: profile.country,
                bio: profile.bio || '',
                occupation: '',
                avatar_url: profile.avatar_url || '',
                interests: profile.interests || [],
                is_verified: profile.is_verified || false,
                verification_level: profile.verification_level,
                languages: profile.languages || [],
                relationship_intention: profile.relationship_intention,
                vip_tier: profile.vip_tier
              };

              setMatchedProfile(matchedProfile);
              setShowMatchPopup(true);
            }
          }
        )
        .subscribe();

      return () => {
        matchesSubscription.unsubscribe();
      };
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadPotentialMatches = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get profiles that the user hasn't swiped on yet
      const { data: swipedProfiles } = await supabase
        .from('swipe_history')
        .select('profile_id')
        .eq('user_id', user.id);

      const swipedIds = swipedProfiles?.map(s => s.profile_id) || [];

      // Get potential matches (exclude self and already swiped profiles)
      let query = supabase
        .from('profiles')
        .select(`
          id,
          username,
          full_name,
          age,
          city,
          country,
          bio,
          avatar_url,
          interests,
          is_verified,
          verification_level,
          languages,
          relationship_intention,
          vip_tier,
          created_at
        `)
        .neq('id', user.id)
        .gte('age', filterAgeRange[0])
        .lte('age', filterAgeRange[1])
        .order('created_at', { ascending: false });

      if (swipedIds.length > 0) {
        query = query.not('id', 'in', `(${swipedIds.join(',')})`);
      }

      if (showOnlyVerified) {
        query = query.eq('is_verified', true);
      }

      const { data: profiles, error } = await query;

      if (error) throw error;

      // Transform profiles to match our interface
      const transformedProfiles: PotentialMatch[] = (profiles || []).map(profile => ({
        id: profile.id,
        username: profile.username,
        full_name: profile.full_name || profile.username,
        age: profile.age || 0,
        city: profile.city || '',
        country: profile.country,
        bio: profile.bio || 'No bio yet',
        occupation: '', // This would need to be added to profiles table
        avatar_url: profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || profile.username)}&background=B11D2D&color=fff`,
        photos: profile.avatar_url ? [profile.avatar_url] : [],
        interests: profile.interests || [],
        is_verified: profile.is_verified || false,
        verification_level: profile.verification_level || 'basic',
        languages: profile.languages || ['English'],
        relationship_intention: profile.relationship_intention || 'looking_for_love',
        vip_tier: profile.vip_tier || 'free',
        // Calculate match percentage based on compatibility
        match_percentage: calculateMatchPercentage(user, profile),
        // Simulate online status (you'd need a real-time presence system for this)
        is_online: Math.random() > 0.5,
        last_active: new Date(Date.now() - Math.random() * 86400000).toISOString()
      }));

      // Sort by match percentage
      transformedProfiles.sort((a, b) => (b.match_percentage || 0) - (a.match_percentage || 0));

      setMatches(transformedProfiles);
    } catch (error: any) {
      console.error('Error loading matches:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateMatchPercentage = (currentUser: any, targetProfile: any): number => {
    let score = 50; // Base score
    
    // Age compatibility (up to 15 points)
    if (targetProfile.age) {
      const userAge = currentUser.age || 30;
      const ageDiff = Math.abs(userAge - targetProfile.age);
      if (ageDiff <= 3) score += 15;
      else if (ageDiff <= 7) score += 10;
      else if (ageDiff <= 12) score += 5;
    }
    
    // Location compatibility (up to 10 points)
    if (targetProfile.country === currentUser.country) {
      score += 10;
      if (targetProfile.city === currentUser.city) score += 5;
    }
    
    // Interest overlap (up to 15 points)
    if (currentUser.interests && targetProfile.interests) {
      const commonInterests = currentUser.interests.filter((i: string) => 
        targetProfile.interests.includes(i)
      ).length;
      score += Math.min(commonInterests * 3, 15);
    }
    
    // Verification status (up to 5 points)
    if (targetProfile.is_verified) score += 5;
    
    // VIP tier (up to 5 points)
    if (targetProfile.vip_tier !== 'free') score += 5;
    
    return Math.min(Math.round(score), 99);
  };

  const recordSwipe = async (targetUserId: string, action: 'like' | 'pass') => {
    if (!user || processingSwipe) return;

    try {
      setProcessingSwipe(true);

      // Record the swipe
      const { error: swipeError } = await supabase
        .from('swipe_history')
        .insert({
          user_id: user.id,
          profile_id: targetUserId,
          action: action
        });

      if (swipeError) throw swipeError;

      // If it's a like, check if there's a mutual like (match)
      if (action === 'like') {
        // Check if the other user has already liked this user
        const { data: mutualLike, error: mutualError } = await supabase
          .from('swipe_history')
          .select('*')
          .eq('user_id', targetUserId)
          .eq('profile_id', user.id)
          .eq('action', 'like')
          .maybeSingle();

        if (mutualError) throw mutualError;

        // If mutual like exists, create a match
        if (mutualLike) {
          const { data: match, error: matchError } = await supabase
            .from('matches')
            .insert({
              user1_id: user.id,
              user2_id: targetUserId,
              status: 'matched'
            })
            .select()
            .single();

          if (matchError) throw matchError;

          // Get the matched user's profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', targetUserId)
            .single();

          if (profile) {
            const matchedProfile: PotentialMatch = {
              id: profile.id,
              username: profile.username,
              full_name: profile.full_name || profile.username,
              age: profile.age || 0,
              city: profile.city || '',
              country: profile.country,
              bio: profile.bio || '',
              occupation: '',
              avatar_url: profile.avatar_url || '',
              interests: profile.interests || [],
              is_verified: profile.is_verified || false,
              verification_level: profile.verification_level,
              languages: profile.languages || [],
              relationship_intention: profile.relationship_intention,
              vip_tier: profile.vip_tier
            };

            setMatchedProfile(matchedProfile);
            setShowMatchPopup(true);
          }
        }
      }

      // Update local state
      if (action === 'like') {
        setLikedProfiles(prev => [...prev, targetUserId]);
      } else {
        setPassedProfiles(prev => [...prev, targetUserId]);
      }

      // Move to next profile
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setProcessingSwipe(false);
      }, 300);

    } catch (error: any) {
      console.error('Error recording swipe:', error);
      toast({
        title: 'Error',
        description: 'Failed to record your choice. Please try again.',
        variant: 'destructive'
      });
      setProcessingSwipe(false);
    }
  };

  const handleLike = (profile: PotentialMatch) => {
    recordSwipe(profile.id, 'like');
  };

  const handlePass = (profile: PotentialMatch) => {
    recordSwipe(profile.id, 'pass');
  };

  const handleSuperLike = (profile: PotentialMatch) => {
    // Super like counts as a like with higher priority
    recordSwipe(profile.id, 'like');
    
    // You could also track super likes separately in the database
    toast({
      title: 'Super Like!',
      description: `You super liked ${profile.full_name}!`,
    });
  };

  const handleMessage = (profileId: string) => {
    navigate(`/chat/${profileId}`);
  };

  const handleSendGift = (profileId: string) => {
    navigate(`/gifts?recipient=${profileId}`);
  };

  const handleViewProfile = (profileId: string) => {
    navigate(`/profile/${profileId}`);
  };

  const resetFilters = () => {
    setFilterAgeRange([18, 50]);
    setFilterDistance(100);
    setShowOnlyVerified(false);
    setShowOnlyOnline(false);
    loadPotentialMatches();
  };

  const getMatchPercentageColor = (percentage: number = 50) => {
    if (percentage >= 90) return '#2C5F2D';
    if (percentage >= 80) return '#1A5F8A';
    if (percentage >= 70) return '#5E2A6B';
    return '#B11D2D';
  };

  const getCountryFlag = (country: string) => {
    const flags: Record<string, string> = {
      'RW': '🇷🇼',
      'Rwanda': '🇷🇼',
      'KE': '🇰🇪',
      'Kenya': '🇰🇪',
      'UG': '🇺🇬',
      'Uganda': '🇺🇬',
      'TZ': '🇹🇿',
      'Tanzania': '🇹🇿',
      'BI': '🇧🇮',
      'Burundi': '🇧🇮',
      'CD': '🇨🇩',
      'Congo': '🇨🇩'
    };
    return flags[country] || '🌍';
  };

  const getRelationshipIntentionLabel = (intention: string): string => {
    const labels: Record<string, string> = {
      'looking_for_love': 'Looking for Love 💕',
      'serious_only': 'Serious Only 💍',
      'friends_first': 'Friends First 🤝',
      'sugar_daddy': 'Sugar Daddy 💎',
      'sugar_mommy': 'Sugar Mommy 💎'
    };
    return labels[intention] || intention;
  };

  // Loading messages
  const loadingMessages = [
    "Searching for your perfect match...",
    "Scanning hearts across East Africa...",
    "Finding someone who shares your values...",
    "Looking for that special connection...",
    "Preparing your love journey..."
  ];

  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const currentProfile = matches[currentIndex];

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F9F7F4' }}>
        {/* Cultural Pattern Background */}
        <div className="fixed inset-0 opacity-5 pointer-events-none">
          <div className="w-full h-full" style={{
            backgroundImage: `repeating-linear-gradient(45deg, #B11D2D 0px, #B11D2D 2px, transparent 2px, transparent 20px)`,
          }} />
        </div>

        <div className="relative min-h-screen flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <Card className="border-0 shadow-2xl overflow-hidden" style={{ 
              backgroundColor: '#FFFFFF',
              borderRadius: '32px 32px 16px 32px'
            }}>
              {/* Cultural Corner Accent */}
              <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24" style={{ 
                  background: 'linear-gradient(135deg, #B11D2D, #CFAF4E)',
                  clipPath: 'polygon(0 0, 100% 0, 100% 100%)',
                  opacity: 0.1
                }} />
              </div>

              <CardContent className="pt-12 pb-8 px-8">
                <div className="text-center">
                  {/* Animated Heart */}
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: [0, 10, -10, 0]
                    }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="relative w-24 h-24 mx-auto mb-6"
                  >
                    <div className="absolute inset-0 rounded-full blur-xl" style={{ background: 'linear-gradient(90deg, #B11D2D, #CFAF4E)' }} />
                    <div className="relative w-full h-full flex items-center justify-center">
                      <Heart className="w-16 h-16" style={{ color: '#B11D2D', fill: '#B11D2D' }} />
                    </div>
                  </motion.div>

                  <h2 className="text-2xl font-bold mb-3" style={{ 
                    fontFamily: "'Playfair Display', serif",
                    color: '#B11D2D'
                  }}>
                    Finding Your Match
                  </h2>
                  
                  <p className="text-sm mb-4" style={{ color: '#7E786E' }}>
                    {loadingMessages[loadingMessageIndex]}
                  </p>

                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-6">
                    <motion.div
                      animate={{ 
                        width: ['0%', '100%'],
                      }}
                      transition={{ 
                        repeat: Infinity, 
                        duration: 2,
                        ease: "linear"
                      }}
                      className="h-full rounded-full"
                      style={{ 
                        background: 'linear-gradient(90deg, #B11D2D, #CFAF4E, #2C5F2D)'
                      }}
                    />
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-xl font-bold" style={{ color: '#B11D2D' }}>50K+</div>
                      <div className="text-xs" style={{ color: '#7E786E' }}>Matches</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold" style={{ color: '#5E2A6B' }}>6</div>
                      <div className="text-xs" style={{ color: '#7E786E' }}>Countries</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold" style={{ color: '#2C5F2D' }}>95%</div>
                      <div className="text-xs" style={{ color: '#7E786E' }}>Success</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F9F7F4' }}>
        <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md"
          >
            <Card className="border-0 shadow-xl overflow-hidden" style={{ 
              backgroundColor: '#FFFFFF',
              borderRadius: '24px 24px 12px 24px'
            }}>
              <CardContent className="pt-8 pb-8 px-6">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                    <X className="w-10 h-10" style={{ color: '#B11D2D' }} />
                  </div>
                  <h3 className="text-xl font-bold mb-2" style={{ 
                    fontFamily: "'Playfair Display', serif",
                    color: '#B11D2D' 
                  }}>
                    Something Went Wrong
                  </h3>
                  <p className="text-sm mb-4" style={{ color: '#7E786E' }}>{error}</p>
                  <Button 
                    onClick={() => window.location.reload()}
                    className="w-full rounded-full"
                    style={{ 
                      background: 'linear-gradient(90deg, #B11D2D, #5E2A6B)',
                      color: 'white',
                      border: 'none'
                    }}
                  >
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!currentProfile && matches.length > 0) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F9F7F4' }}>
        {/* Cultural Background Pattern */}
        <div className="fixed inset-0 opacity-5 pointer-events-none">
          <div className="w-full h-full" style={{
            backgroundImage: `radial-gradient(circle at 20% 30%, #B11D2D 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="max-w-md mx-auto text-center"
          >
            <Card className="border-0 shadow-xl overflow-hidden" style={{ 
              backgroundColor: '#FFFFFF',
              borderRadius: '32px 32px 16px 32px'
            }}>
              <CardContent className="p-8">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-red-100 to-purple-100 flex items-center justify-center">
                  <RefreshCw className="w-12 h-12" style={{ color: '#B11D2D' }} />
                </div>
                <h2 className="text-2xl font-bold mb-3" style={{ 
                  fontFamily: "'Playfair Display', serif",
                  color: '#26231F'
                }}>
                  No More Profiles
                </h2>
                <p className="mb-6" style={{ color: '#5E5950' }}>
                  You've viewed all available matches in your area. Check back soon for new people!
                </p>
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={() => {
                      setCurrentIndex(0);
                      loadPotentialMatches();
                    }}
                    className="w-full rounded-full"
                    style={{ 
                      background: 'linear-gradient(90deg, #B11D2D, #5E2A6B)',
                      color: 'white',
                      border: 'none'
                    }}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Start Over
                  </Button>
                  <Link to="/discover">
                    <Button
                      variant="outline"
                      className="w-full rounded-full"
                      style={{ borderColor: '#E5E0D8' }}
                    >
                      Browse Discover
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!currentProfile) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F9F7F4' }}>
        <div className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="max-w-md mx-auto text-center"
          >
            <Card className="border-0 shadow-xl overflow-hidden" style={{ 
              backgroundColor: '#FFFFFF',
              borderRadius: '32px 32px 16px 32px'
            }}>
              <CardContent className="p-8">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-red-100 to-purple-100 flex items-center justify-center">
                  <Users className="w-12 h-12" style={{ color: '#B11D2D' }} />
                </div>
                <h2 className="text-2xl font-bold mb-3" style={{ 
                  fontFamily: "'Playfair Display', serif",
                  color: '#26231F'
                }}>
                  No Profiles Found
                </h2>
                <p className="mb-6" style={{ color: '#5E5950' }}>
                  Try adjusting your filters or check back later for new people in your area.
                </p>
                <Button
                  onClick={resetFilters}
                  className="w-full rounded-full"
                  style={{ 
                    background: 'linear-gradient(90deg, #B11D2D, #5E2A6B)',
                    color: 'white',
                    border: 'none'
                  }}
                >
                  Reset Filters
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F7F4' }}>
      {/* Cultural Background Pattern */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="w-full h-full" style={{
          backgroundImage: `radial-gradient(circle at 20% 30%, #B11D2D 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Header */}
      <div className="relative overflow-hidden" style={{ 
        background: 'linear-gradient(135deg, #B11D2D 0%, #5E2A6B 100%)'
      }}>
        {/* Cultural Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: `repeating-linear-gradient(45deg, #CFAF4E 0px, #CFAF4E 2px, transparent 2px, transparent 12px)`,
          }} />
        </div>

        {/* Intore Silhouettes */}
        <div className="absolute bottom-0 right-0 opacity-20">
          <div className="flex gap-1 p-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-6 h-12" style={{
                backgroundColor: '#CFAF4E',
                clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)',
                transform: `rotate(${i % 2 === 0 ? -3 : 3}deg)`,
              }} />
            ))}
          </div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2" style={{ 
                  fontFamily: "'Playfair Display', serif"
                }}>
                  <Heart className="w-5 h-5 fill-current" />
                  Matching
                </h1>
                <p className="text-white/80 text-xs">
                  {matches.length - currentIndex} profiles remaining
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <Filter className="w-5 h-5" />
              </Button>
              <Link to="/discover">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                >
                  <Compass className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E0D8' }}
          >
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold" style={{ color: '#26231F' }}>Match Filters</h3>
                <Button
                  onClick={resetFilters}
                  variant="ghost"
                  size="sm"
                  className="text-sm"
                  style={{ color: '#7E786E' }}
                >
                  Reset
                </Button>
              </div>

              <div className="space-y-4">
                {/* Age Range */}
                <div>
                  <label className="block text-sm mb-2" style={{ color: '#26231F' }}>
                    Age: {filterAgeRange[0]} - {filterAgeRange[1]}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="range"
                      min={18}
                      max={80}
                      value={filterAgeRange[0]}
                      onChange={(e) => setFilterAgeRange([parseInt(e.target.value), filterAgeRange[1]])}
                      className="w-full"
                      style={{ accentColor: '#B11D2D' }}
                    />
                    <input
                      type="range"
                      min={18}
                      max={80}
                      value={filterAgeRange[1]}
                      onChange={(e) => setFilterAgeRange([filterAgeRange[0], parseInt(e.target.value)])}
                      className="w-full"
                      style={{ accentColor: '#B11D2D' }}
                    />
                  </div>
                </div>

                {/* Distance - Note: This requires geolocation data in profiles */}
                <div>
                  <label className="block text-sm mb-2" style={{ color: '#26231F' }}>
                    Max Distance: {filterDistance} km
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={200}
                    value={filterDistance}
                    onChange={(e) => setFilterDistance(parseInt(e.target.value))}
                    className="w-full"
                    style={{ accentColor: '#B11D2D' }}
                  />
                </div>

                {/* Checkboxes */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={showOnlyVerified}
                      onChange={(e) => setShowOnlyVerified(e.target.checked)}
                      className="rounded"
                      style={{ accentColor: '#2C5F2D' }}
                    />
                    <span className="text-sm" style={{ color: '#26231F' }}>Verified Only</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={showOnlyOnline}
                      onChange={(e) => setShowOnlyOnline(e.target.checked)}
                      className="rounded"
                      style={{ accentColor: '#10B981' }}
                    />
                    <span className="text-sm" style={{ color: '#26231F' }}>Online Now</span>
                  </label>
                </div>

                <Button
                  onClick={loadPotentialMatches}
                  className="w-full rounded-full"
                  style={{ 
                    background: 'linear-gradient(90deg, #B11D2D, #5E2A6B)',
                    color: 'white'
                  }}
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-md mx-auto">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-4">
            <Badge style={{ backgroundColor: '#F0EDE8', color: '#5E5950' }}>
              {currentIndex + 1} / {matches.length}
            </Badge>
            <div className="flex items-center gap-2">
              <Badge style={{ backgroundColor: '#F0EDE8', color: '#5E5950' }}>
                <Heart className="w-3 h-3 mr-1 fill-current" style={{ color: '#B11D2D' }} />
                {likedProfiles.length}
              </Badge>
            </div>
          </div>

          {/* Profile Card */}
          {currentProfile && (
            <motion.div
              key={currentProfile.id}
              initial={{ scale: 0.9, opacity: 0, rotate: -5 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.9, opacity: 0, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.7}
              onDragEnd={(e, { offset, velocity }) => {
                const swipe = offset.x;
                if (swipe > 100) {
                  handleLike(currentProfile);
                } else if (swipe < -100) {
                  handlePass(currentProfile);
                }
              }}
              className="cursor-grab active:cursor-grabbing"
            >
              <Card className="border-0 shadow-2xl overflow-hidden" style={{ 
                backgroundColor: '#FFFFFF',
                borderRadius: '32px 32px 16px 32px'
              }}>
                {/* Photo Carousel */}
                <div className="relative h-[500px]">
                  <img
                    src={currentProfile.avatar_url}
                    alt={currentProfile.full_name}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                  {/* Match Percentage */}
                  <div className="absolute top-4 right-4">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-xl" style={{ 
                      backgroundColor: getMatchPercentageColor(currentProfile.match_percentage)
                    }}>
                      {currentProfile.match_percentage}%
                    </div>
                  </div>

                  {/* VIP Badge */}
                  {currentProfile.vip_tier !== 'free' && (
                    <div className="absolute top-4 left-4">
                      <Badge className="px-3 py-1 flex items-center gap-1 shadow-lg" style={{ 
                        backgroundColor: '#CFAF4E',
                        color: '#26231F'
                      }}>
                        <Crown className="w-3 h-3" />
                        {currentProfile.vip_tier}
                      </Badge>
                    </div>
                  )}

                  {/* Online Indicator */}
                  {currentProfile.is_online && (
                    <div className="absolute bottom-20 left-4 flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs text-white">Online now</span>
                    </div>
                  )}

                  {/* Profile Info Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
                        {currentProfile.full_name}, {currentProfile.age}
                      </h2>
                      {currentProfile.is_verified && (
                        <Shield className="w-5 h-5" style={{ color: '#2C5F2D', fill: '#2C5F2D' }} />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm mb-2">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{currentProfile.city || currentProfile.country} {getCountryFlag(currentProfile.country)}</span>
                      </div>
                      {currentProfile.distance && (
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{currentProfile.distance} km</span>
                        </div>
                      )}
                    </div>

                    <Badge className="mb-2" style={{ 
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.3)'
                    }}>
                      {getRelationshipIntentionLabel(currentProfile.relationship_intention)}
                    </Badge>
                  </div>
                </div>

                {/* Bio Section */}
                <CardContent className="p-6">
                  <p className="text-sm mb-4 line-clamp-3" style={{ color: '#5E5950' }}>
                    {currentProfile.bio}
                  </p>

                  {/* Interests */}
                  {currentProfile.interests && currentProfile.interests.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {currentProfile.interests.slice(0, 4).map((interest, i) => (
                          <Badge key={i} variant="outline" className="text-xs" style={{ 
                            backgroundColor: '#F9F7F4',
                            borderColor: '#E5E0D8',
                            color: '#5E5950'
                          }}>
                            {interest}
                          </Badge>
                        ))}
                        {currentProfile.interests.length > 4 && (
                          <Badge variant="outline" className="text-xs" style={{ 
                            backgroundColor: '#F9F7F4',
                            borderColor: '#E5E0D8',
                            color: '#5E5950'
                          }}>
                            +{currentProfile.interests.length - 4}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Languages */}
                  {currentProfile.languages && currentProfile.languages.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                      <div>
                        <p className="text-xs" style={{ color: '#7E786E' }}>Languages</p>
                        <p className="font-medium" style={{ color: '#26231F' }}>{currentProfile.languages.join(', ')}</p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-center gap-4">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Button
                        onClick={() => handlePass(currentProfile)}
                        disabled={processingSwipe}
                        className="w-16 h-16 rounded-full bg-white shadow-xl hover:shadow-2xl disabled:opacity-50"
                        style={{ border: '2px solid #E5E0D8' }}
                      >
                        <X className="w-8 h-8" style={{ color: '#B11D2D' }} />
                      </Button>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onClick={() => handleSuperLike(currentProfile)}
                        disabled={processingSwipe}
                        className="w-12 h-12 rounded-full disabled:opacity-50"
                        style={{ 
                          background: 'linear-gradient(135deg, #5E2A6B, #CFAF4E)',
                          border: 'none'
                        }}
                      >
                        <Star className="w-5 h-5 text-white" />
                      </Button>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Button
                        onClick={() => handleLike(currentProfile)}
                        disabled={processingSwipe}
                        className="w-16 h-16 rounded-full shadow-xl hover:shadow-2xl disabled:opacity-50"
                        style={{ 
                          background: 'linear-gradient(135deg, #B11D2D, #5E2A6B)',
                          border: 'none'
                        }}
                      >
                        <Heart className="w-8 h-8 text-white fill-current" />
                      </Button>
                    </motion.div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center justify-center gap-6 mt-4">
                    <button
                      onClick={() => handleViewProfile(currentProfile.id)}
                      className="text-xs flex items-center gap-1"
                      style={{ color: '#7E786E' }}
                    >
                      <Users className="w-3 h-3" />
                      Profile
                    </button>
                    <button
                      onClick={() => handleMessage(currentProfile.id)}
                      className="text-xs flex items-center gap-1"
                      style={{ color: '#7E786E' }}
                    >
                      <MessageCircle className="w-3 h-3" />
                      Message
                    </button>
                    <button
                      onClick={() => handleSendGift(currentProfile.id)}
                      className="text-xs flex items-center gap-1"
                      style={{ color: '#7E786E' }}
                    >
                      <Gift className="w-3 h-3" />
                      Gift
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Swipe Instructions */}
          <div className="flex items-center justify-center gap-4 mt-4 text-xs" style={{ color: '#7E786E' }}>
            <div className="flex items-center gap-1">
              <X className="w-3 h-3" />
              <span>Pass</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              <span>Super</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              <span>Like</span>
            </div>
          </div>
        </div>
      </div>

      {/* Match Celebration Modal */}
      <AnimatePresence>
        {showMatchPopup && matchedProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.5, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.5, y: 50, opacity: 0 }}
              transition={{ type: 'spring', damping: 15 }}
              className="bg-white rounded-3xl max-w-sm w-full overflow-hidden"
              style={{ borderRadius: '32px 32px 16px 32px' }}
            >
              {/* Confetti Effect */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ 
                      x: Math.random() * window.innerWidth,
                      y: -20,
                      rotate: 0
                    }}
                    animate={{ 
                      y: window.innerHeight + 100,
                      rotate: 360
                    }}
                    transition={{ 
                      duration: 2 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 2
                    }}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: i % 3 === 0 ? '#B11D2D' : i % 3 === 1 ? '#CFAF4E' : '#2C5F2D'
                    }}
                  />
                ))}
              </div>

              <div className="relative p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                  className="w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #B11D2D, #5E2A6B)' }}
                >
                  <Heart className="w-12 h-12 text-white fill-current" />
                </motion.div>

                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-3xl font-bold mb-2"
                  style={{ fontFamily: "'Playfair Display', serif", color: '#26231F' }}
                >
                  It's a Match! 🎉
                </motion.h2>

                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mb-6"
                  style={{ color: '#5E5950' }}
                >
                  You and <span className="font-bold" style={{ color: '#B11D2D' }}>{matchedProfile.full_name}</span> liked each other!
                </motion.p>

                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="flex items-center justify-center gap-4 mb-6"
                >
                  <Avatar className="w-20 h-20 border-4 border-white shadow-xl">
                    <AvatarImage src={user?.avatar_url || ''} />
                    <AvatarFallback>You</AvatarFallback>
                  </Avatar>
                  <Heart className="w-8 h-8" style={{ color: '#B11D2D' }} />
                  <Avatar className="w-20 h-20 border-4 border-white shadow-xl">
                    <AvatarImage src={matchedProfile.avatar_url} />
                    <AvatarFallback>{matchedProfile.full_name[0]}</AvatarFallback>
                  </Avatar>
                </motion.div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="flex flex-col gap-3"
                >
                  <Button
                    onClick={() => {
                      setShowMatchPopup(false);
                      sendMatchMessage(matchedProfile.id, getRandomIceBreaker());
                    }}
                    className="w-full rounded-full py-6"
                    style={{ 
                      background: 'linear-gradient(90deg, #B11D2D, #5E2A6B)',
                      color: 'white',
                      border: 'none'
                    }}
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Send a Message
                  </Button>
                  <Button
                    onClick={() => setShowMatchPopup(false)}
                    variant="outline"
                    className="w-full rounded-full py-6"
                    style={{ borderColor: '#E5E0D8' }}
                  >
                    Keep Swiping
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Matching = () => {
  return (
    <AuthGuard>
      <MatchingContent />
    </AuthGuard>
  );
};

export default Matching;