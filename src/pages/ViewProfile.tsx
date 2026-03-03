import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Heart, 
  MessageCircle, 
  Gift, 
  MapPin, 
  Calendar, 
  Briefcase, 
  Star,
  Shield,
  X,
  ChevronLeft,
  ChevronRight,
  Share2,
  Flag,
  Camera,
  Users,
  Music,
  Coffee,
  Book,
  Plane,
  Gamepad2,
  Palette,
  Film,
  Mic
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAuth } from '@/hooks/use-auth';

interface UserProfile {
  id: string;
  name: string;
  age: number;
  location: string;
  bio: string;
  occupation: string;
  photos: string[];
  interests: string[];
  verified: boolean;
  verificationLevel: string;
  distance: number;
  lastActive: string;
  languages: string[];
  relationshipIntention: string;
  vipTier: string;
  instagram?: string;
  spotify?: string;
}

const ViewProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isMatched, setIsMatched] = useState(false);

  // Mock user data - in real app, fetch from API
  const profile: UserProfile = {
    id: userId || '1',
    name: 'Grace Mwangi',
    age: 26,
    location: 'Nairobi, Kenya',
    bio: 'Adventure seeker and coffee enthusiast. Love exploring new places, trying different cuisines, and meeting interesting people. Looking for someone who shares my passion for life and isn\'t afraid to be spontaneous.',
    occupation: 'Marketing Manager',
    photos: [
      'https://images.unsplash.com/photo-1494790108755-2616b332c8cd?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1508213980581-4b0b65e91b5c?w=400&h=600&fit=crop'
    ],
    interests: ['Travel', 'Music', 'Coffee', 'Photography', 'Reading', 'Cooking'],
    verified: true,
    verificationLevel: 'premium',
    distance: 12,
    lastActive: '2 hours ago',
    languages: ['English', 'Swahili', 'Kinyarwanda'],
    relationshipIntention: 'serious_only',
    vipTier: 'premium',
    instagram: '@grace_mwangi',
    spotify: 'Grace Mwangi'
  };

  const interestIcons: Record<string, React.ReactNode> = {
    'Travel': <Plane className="w-4 h-4" />,
    'Music': <Music className="w-4 h-4" />,
    'Coffee': <Coffee className="w-4 h-4" />,
    'Photography': <Camera className="w-4 h-4" />,
    'Reading': <Book className="w-4 h-4" />,
    'Cooking': <Palette className="w-4 h-4" />,
    'Gaming': <Gamepad2 className="w-4 h-4" />,
    'Movies': <Film className="w-4 h-4" />,
    'Singing': <Mic className="w-4 h-4" />
  };

  const getRelationshipIntentionBadge = (intention: string) => {
    const intentions: Record<string, { text: string; color: string }> = {
      looking_for_love: { text: 'Looking for Love 💕', color: '#EC4899' },
      serious_only: { text: 'Serious Only 💍', color: '#DC2626' },
      friends_first: { text: 'Friends First 🤝', color: '#3B82F6' },
      casual_dating: { text: 'Casual Dating 😊', color: '#10B981' }
    };
    
    const intentionData = intentions[intention as keyof typeof intentions];
    return intentionData || { text: 'Open to Connect', color: '#6B7280' };
  };

  const getVerificationBadge = (level: string) => {
    const badges: Record<string, { text: string; color: string }> = {
      basic: { text: 'Verified', color: '#3B82F6' },
      standard: { text: 'Verified', color: '#3B82F6' },
      premium: { text: 'Premium Verified', color: '#8B5CF6' }
    };
    
    const badge = badges[level as keyof typeof badges] || badges.basic;
    return badge;
  };

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % profile.photos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + profile.photos.length) % profile.photos.length);
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    if (!isLiked && !isMatched) {
      // Simulate match after like
      setTimeout(() => setIsMatched(true), 1000);
    }
  };

  const handleShare = () => {
    // Share profile logic
    console.log('Share profile');
  };

  const handleReport = () => {
    setShowReportModal(true);
  };

  const handleMessage = () => {
    navigate(`/chat/${profile.id}`);
  };

  const handleSendGift = () => {
    navigate(`/gifts?recipient=${profile.id}`);
  };

  if (!user) return null;

  return (
    <AuthGuard>
      <div className="min-h-screen" style={{ backgroundColor: '#F9F7F4' }}>
        {/* Cultural Background Pattern */}
        <div className="fixed inset-0 opacity-5 pointer-events-none">
          <div className="w-full h-full" style={{
            backgroundImage: `repeating-linear-gradient(45deg, #B11D2D 0px, #B11D2D 1px, transparent 1px, transparent 16px)`,
          }} />
        </div>

        <div className="relative z-10">
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

            <div className="relative z-10 container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <Button
                  onClick={() => navigate(-1)}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back
                </Button>

                <div className="flex gap-2">
                  <Button
                    onClick={handleShare}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                  >
                    <Share2 className="w-5 h-5" />
                  </Button>
                  <Button
                    onClick={handleReport}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                  >
                    <Flag className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-4 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Photo Gallery */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card className="border-0 shadow-xl overflow-hidden" style={{ 
                    backgroundColor: '#FFFFFF',
                    borderRadius: '24px 24px 12px 24px'
                  }}>
                    <div className="relative">
                      {/* Main Photo */}
                      <div className="relative h-96 md:h-[500px]">
                        <img
                          src={profile.photos[currentPhotoIndex]}
                          alt={`${profile.name}'s photo`}
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Photo Navigation */}
                        {profile.photos.length > 1 && (
                          <>
                            <button
                              onClick={prevPhoto}
                              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                            >
                              <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                              onClick={nextPhoto}
                              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          </>
                        )}

                        {/* Photo Indicators */}
                        {profile.photos.length > 1 && (
                          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                            {profile.photos.map((_, index) => (
                              <button
                                key={index}
                                onClick={() => setCurrentPhotoIndex(index)}
                                className={`w-2 h-2 rounded-full transition-colors ${
                                  index === currentPhotoIndex ? 'bg-white' : 'bg-white/50'
                                }`}
                              />
                            ))}
                          </div>
                        )}

                        {/* Verification Badge */}
                        {profile.verified && (
                          <div className="absolute top-4 right-4">
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ 
                              backgroundColor: 'rgba(255,255,255,0.9)',
                              backdropFilter: 'blur(10px)'
                            }}>
                              <Shield className="w-4 h-4" style={{ color: getVerificationBadge(profile.verificationLevel).color }} />
                              <span className="text-sm font-medium" style={{ color: '#26231F' }}>
                                {getVerificationBadge(profile.verificationLevel).text}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Photo Thumbnails */}
                      {profile.photos.length > 1 && (
                        <div className="p-4 border-t" style={{ borderColor: '#E5E0D8' }}>
                          <div className="flex gap-2 overflow-x-auto">
                            {profile.photos.map((photo, index) => (
                              <button
                                key={index}
                                onClick={() => setCurrentPhotoIndex(index)}
                                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                                  index === currentPhotoIndex ? 'border-red-500' : 'border-transparent'
                                }`}
                              >
                                <img
                                  src={photo}
                                  alt={`Photo ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>

                {/* Profile Info */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <Card className="border-0 shadow-lg overflow-hidden" style={{ 
                    backgroundColor: '#FFFFFF',
                    borderRadius: '24px 24px 12px 24px'
                  }}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h1 className="text-2xl font-bold mb-2" style={{ 
                            fontFamily: "'Playfair Display', serif",
                            color: '#26231F'
                          }}>
                            {profile.name}, {profile.age}
                          </h1>
                          <div className="flex items-center gap-4 text-sm" style={{ color: '#5E5950' }}>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span>{profile.location}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>Active {profile.lastActive}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{profile.distance} km away</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          {profile.vipTier !== 'free' && (
                            <Badge style={{ 
                              backgroundColor: '#CFAF4E',
                              color: '#26231F'
                            }}>
                              {profile.vipTier.toUpperCase()}
                            </Badge>
                          )}
                          <Badge style={{ 
                            backgroundColor: getRelationshipIntentionBadge(profile.relationshipIntention).color,
                            color: 'white'
                          }}>
                            {getRelationshipIntentionBadge(profile.relationshipIntention).text}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="flex items-center gap-3">
                          <Briefcase className="w-5 h-5" style={{ color: '#B11D2D' }} />
                          <div>
                            <p className="text-sm font-medium" style={{ color: '#26231F' }}>Occupation</p>
                            <p className="text-sm" style={{ color: '#5E5950' }}>{profile.occupation}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Users className="w-5 h-5" style={{ color: '#B11D2D' }} />
                          <div>
                            <p className="text-sm font-medium" style={{ color: '#26231F' }}>Languages</p>
                            <p className="text-sm" style={{ color: '#5E5950' }}>{profile.languages.join(', ')}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mb-6">
                        <h3 className="font-semibold mb-3" style={{ color: '#26231F' }}>About</h3>
                        <p className="leading-relaxed" style={{ color: '#5E5950' }}>
                          {profile.bio}
                        </p>
                      </div>

                      <div className="mb-6">
                        <h3 className="font-semibold mb-3" style={{ color: '#26231F' }}>Interests</h3>
                        <div className="flex flex-wrap gap-2">
                          {profile.interests.map((interest, index) => (
                            <Badge
                              key={index}
                              className="px-3 py-1 flex items-center gap-1"
                              style={{ 
                                backgroundColor: '#F0EDE8',
                                color: '#26231F'
                              }}
                            >
                              {interestIcons[interest]}
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Social Links */}
                      {(profile.instagram || profile.spotify) && (
                        <div className="mb-6">
                          <h3 className="font-semibold mb-3" style={{ color: '#26231F' }}>Social</h3>
                          <div className="flex gap-4">
                            {profile.instagram && (
                              <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: '#F9F7F4' }}>
                                <Camera className="w-4 h-4" style={{ color: '#E4405F' }} />
                                <span className="text-sm" style={{ color: '#5E5950' }}>{profile.instagram}</span>
                              </div>
                            )}
                            {profile.spotify && (
                              <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: '#F9F7F4' }}>
                                <Music className="w-4 h-4" style={{ color: '#1DB954' }} />
                                <span className="text-sm" style={{ color: '#5E5950' }}>{profile.spotify}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Action Buttons */}
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Card className="border-0 shadow-lg overflow-hidden" style={{ 
                    backgroundColor: '#FFFFFF',
                    borderRadius: '24px 24px 12px 24px'
                  }}>
                    <CardContent className="p-6 space-y-3">
                      <Button
                        onClick={handleLike}
                        className={`w-full rounded-full ${
                          isLiked ? 'bg-gray-100 hover:bg-gray-200' : ''
                        }`}
                        style={{
                          ...(isLiked ? { color: '#5E5950' } : {
                            background: 'linear-gradient(90deg, #B11D2D, #5E2A6B)',
                            color: 'white',
                            border: 'none'
                          })
                        }}
                      >
                        <Heart className={`w-5 h-5 mr-2 ${isLiked ? 'fill-current' : ''}`} />
                        {isLiked ? 'Liked' : 'Like Profile'}
                      </Button>

                      <Button
                        onClick={handleMessage}
                        variant="outline"
                        className="w-full rounded-full"
                        style={{ borderColor: '#E5E0D8' }}
                      >
                        <MessageCircle className="w-5 h-5 mr-2" />
                        Send Message
                      </Button>

                      <Button
                        onClick={handleSendGift}
                        variant="outline"
                        className="w-full rounded-full"
                        style={{ borderColor: '#E5E0D8' }}
                      >
                        <Gift className="w-5 h-5 mr-2" />
                        Send Gift
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Quick Stats */}
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <Card className="border-0 shadow-lg overflow-hidden" style={{ 
                    backgroundColor: '#FFFFFF',
                    borderRadius: '24px 24px 12px 24px'
                  }}>
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-4" style={{ color: '#26231F' }}>Profile Stats</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm" style={{ color: '#5E5950' }}>Profile Views</span>
                          <span className="font-semibold" style={{ color: '#26231F' }}>1,247</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm" style={{ color: '#5E5950' }}>Likes Received</span>
                          <span className="font-semibold" style={{ color: '#26231F' }}>892</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm" style={{ color: '#5E5950' }}>Response Rate</span>
                          <span className="font-semibold" style={{ color: '#26231F' }}>78%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm" style={{ color: '#5E5950' }}>Member Since</span>
                          <span className="font-semibold" style={{ color: '#26231F' }}>3 months</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Match Celebration Modal */}
        <AnimatePresence>
          {isMatched && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                className="bg-white rounded-2xl p-8 text-center max-w-sm mx-4 w-full"
                style={{ borderRadius: '24px 24px 12px 24px' }}
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center">
                  <Heart className="w-10 h-10 text-white fill-current" />
                </div>
                <h2 className="text-2xl font-bold mb-2" style={{ 
                  fontFamily: "'Playfair Display', serif",
                  color: '#26231F'
                }}>
                  It's a Match! 🎉
                </h2>
                <p className="mb-6" style={{ color: '#5E5950' }}>
                  You and {profile.name} liked each other! Start a conversation to get to know them better.
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={handleMessage}
                    className="flex-1 rounded-full"
                    style={{ 
                      background: 'linear-gradient(90deg, #B11D2D, #5E2A6B)',
                      color: 'white',
                      border: 'none'
                    }}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                  <Button
                    onClick={() => setIsMatched(false)}
                    variant="outline"
                    className="rounded-full"
                    style={{ borderColor: '#E5E0D8' }}
                  >
                    Later
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Report Modal */}
        <AnimatePresence>
          {showReportModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl p-6 max-w-md mx-4 w-full"
                style={{ borderRadius: '24px 24px 12px 24px' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold" style={{ color: '#26231F' }}>
                    Report Profile
                  </h3>
                  <Button
                    onClick={() => setShowReportModal(false)}
                    variant="ghost"
                    size="sm"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {[
                    'Fake Profile',
                    'Inappropriate Content',
                    'Spam',
                    'Harassment',
                    'Underage User',
                    'Other'
                  ].map((reason) => (
                    <button
                      key={reason}
                      onClick={() => {
                        console.log('Report:', reason);
                        setShowReportModal(false);
                      }}
                      className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                      style={{ backgroundColor: '#F9F7F4' }}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AuthGuard>
  );
};

export default ViewProfile;