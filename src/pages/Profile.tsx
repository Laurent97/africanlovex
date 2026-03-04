import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Camera, 
  Edit, 
  MapPin, 
  Heart, 
  Star, 
  Shield, 
  Settings,
  Upload,
  X,
  ChevronRight,
  User,
  Calendar,
  Briefcase,
  Globe,
  Music,
  Coffee,
  Book,
  Plane,
  Gamepad2,
  Dumbbell,
  Palette,
  Film,
  Mic,
  Camera as CameraIcon,
  CheckCircle,
  Award,
  Zap,
  Crown,
  Diamond,
  Gem,
  Clock,
  Eye,
  MessageCircle,
  Gift,
  Users,
  TrendingUp,
  ChevronLeft,
  Plus,
  Loader2,
  AlertCircle,
  Info,
  Trash2,
  Move,
  Star as StarIcon,
  Sparkles,
  Lock,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useVerification } from '@/hooks/use-verification';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import VerificationBadge from '@/components/verification/VerificationBadge';
import VerificationGate from '@/components/verification/VerificationGate';
import { 
  ProfilePhoto, 
  UserProfile, 
  fetchUserPhotos, 
  addProfilePhoto, 
  setMainPhoto, 
  deletePhoto, 
  reorderPhotos, 
  getPhotoCount, 
  getMainPhotoUrl, 
  getPhotoUrls 
} from '@/lib/profile-photos';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { status: verificationStatus, startVerification } = useVerification(user?.id);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('about');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<number | null>(null);
  const [deleteType, setDeleteType] = useState<'photo' | 'avatar'>('photo');
  const [isLoading, setIsLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);

  const [profileData, setProfileData] = useState<UserProfile>({
    id: user?.id || '',
    username: user?.user_metadata?.username || '',
    full_name: user?.user_metadata?.name || user?.email?.split('@')[0] || 'User',
    avatar_url: '',
    bio: 'Passionate about connecting with meaningful people. Love exploring new cultures and sharing experiences.',
    age: 25,
    gender: '',
    country: 'Rwanda',
    city: 'Kigali',
    tribe: '',
    languages: ['English'],
    interests: ['Travel', 'Music', 'Coffee'],
    relationship_intention: 'looking_for_love',
    verification_level: verificationStatus?.badge_type === 'golden' ? 'premium' : verificationStatus?.badge_type === 'premium' ? 'premium' : 'basic',
    is_verified: verificationStatus?.is_verified || false,
    is_premium: false,
    vip_tier: 'free',
    coins_balance: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    
    // Optional fields
    likes: 0,
    matches: 0,
    views: 0,
    response_rate: 0,
    height: 175,
    education: "Bachelor's Degree",
    drinking: 'Socially',
    smoking: 'Never',
    kids: 'Want someday',
    religion: 'Spiritual',
    instagram: '',
    spotify: '',
    photos: []
  });

  const [tempData, setTempData] = useState<UserProfile>(profileData);

  // Available languages list
  const languagesList = [
    'English', 'French', 'Spanish', 'German', 'Italian', 'Portuguese',
    'Russian', 'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hindi',
    'Swahili', 'Kinyarwanda', 'Luganda', 'Lingala', 'Zulu', 'Yoruba'
  ];

  // Load profile data from Supabase on mount
  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  // Update profile data when verification status changes
  useEffect(() => {
    if (verificationStatus && profileData) {
      setProfileData(prev => ({
        ...prev,
        is_verified: verificationStatus.is_verified,
        verification_level: verificationStatus.badge_type === 'golden' ? 'premium' : verificationStatus.badge_type === 'premium' ? 'premium' : 'basic'
      }));
    }
  }, [verificationStatus]);

  const loadProfileData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Try to get existing profile
      const { data: existingProfile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // Load user photos
      const photos = await fetchUserPhotos(user.id);

      if (existingProfile) {
        // Parse array fields if they're stored as JSON strings
        const languages = typeof existingProfile.languages === 'string' 
          ? JSON.parse(existingProfile.languages) 
          : existingProfile.languages || profileData.languages;
          
        const interests = typeof existingProfile.interests === 'string' 
          ? JSON.parse(existingProfile.interests) 
          : existingProfile.interests || profileData.interests;

        setProfileData({
          id: existingProfile.id,
          username: existingProfile.username || profileData.username,
          full_name: existingProfile.full_name || profileData.full_name,
          avatar_url: existingProfile.avatar_url || profileData.avatar_url,
          bio: existingProfile.bio || profileData.bio,
          age: existingProfile.age || profileData.age,
          gender: existingProfile.gender || profileData.gender,
          country: existingProfile.country || profileData.country,
          city: existingProfile.city || profileData.city,
          tribe: existingProfile.tribe || profileData.tribe,
          languages: languages,
          interests: interests,
          relationship_intention: existingProfile.relationship_intention || profileData.relationship_intention,
          verification_level: existingProfile.verification_level || profileData.verification_level,
          is_verified: existingProfile.is_verified || false,
          is_premium: existingProfile.is_premium || false,
          vip_tier: existingProfile.vip_tier || 'free',
          coins_balance: existingProfile.coins_balance || 0,
          created_at: existingProfile.created_at || new Date().toISOString(),
          updated_at: existingProfile.updated_at || new Date().toISOString(),
          
          // Optional fields
          likes: existingProfile.likes || 0,
          matches: existingProfile.matches || 0,
          views: existingProfile.views || 0,
          response_rate: existingProfile.response_rate || 0,
          height: existingProfile.height || 175,
          education: existingProfile.education || "Bachelor's Degree",
          drinking: existingProfile.drinking || 'Socially',
          smoking: existingProfile.smoking || 'Never',
          kids: existingProfile.kids || 'Want someday',
          religion: existingProfile.religion || 'Spiritual',
          instagram: existingProfile.instagram || '',
          spotify: existingProfile.spotify || '',
          photos: photos
        });
        
        setTempData({
          id: existingProfile.id,
          username: existingProfile.username || profileData.username,
          full_name: existingProfile.full_name || profileData.full_name,
          avatar_url: existingProfile.avatar_url || profileData.avatar_url,
          bio: existingProfile.bio || profileData.bio,
          age: existingProfile.age || profileData.age,
          gender: existingProfile.gender || profileData.gender,
          country: existingProfile.country || profileData.country,
          city: existingProfile.city || profileData.city,
          tribe: existingProfile.tribe || profileData.tribe,
          languages: languages,
          interests: interests,
          relationship_intention: existingProfile.relationship_intention || profileData.relationship_intention,
          verification_level: existingProfile.verification_level || profileData.verification_level,
          is_verified: existingProfile.is_verified || false,
          is_premium: existingProfile.is_premium || false,
          vip_tier: existingProfile.vip_tier || 'free',
          coins_balance: existingProfile.coins_balance || 0,
          created_at: existingProfile.created_at || new Date().toISOString(),
          updated_at: existingProfile.updated_at || new Date().toISOString(),
          
          // Optional fields
          likes: existingProfile.likes || 0,
          matches: existingProfile.matches || 0,
          views: existingProfile.views || 0,
          response_rate: existingProfile.response_rate || 0,
          height: existingProfile.height || 175,
          education: existingProfile.education || "Bachelor's Degree",
          drinking: existingProfile.drinking || 'Socially',
          smoking: existingProfile.smoking || 'Never',
          kids: existingProfile.kids || 'Want someday',
          religion: existingProfile.religion || 'Spiritual',
          instagram: existingProfile.instagram || '',
          spotify: existingProfile.spotify || '',
          photos: photos
        });
      } else {
        // Create new profile
        const newProfile: UserProfile = {
          id: user.id,
          username: user.user_metadata?.username || '',
          full_name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          avatar_url: '',
          bio: 'Passionate about connecting with meaningful people. Love exploring new cultures and sharing experiences.',
          age: 25,
          gender: '',
          country: 'Rwanda',
          city: 'Kigali',
          tribe: '',
          languages: ['English'],
          interests: ['Travel', 'Music', 'Coffee'],
          relationship_intention: 'looking_for_love' as const,
          verification_level: 'basic',
          is_verified: false,
          is_premium: false,
          vip_tier: 'free',
          coins_balance: 0,
          likes: 0,
          matches: 0,
          views: 0,
          response_rate: 0,
          photos: photos,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { error: insertError } = await supabase
          .from('profiles')
          .insert([newProfile]);

        if (insertError) throw insertError;
        
        setProfileData(newProfile);
        setTempData(newProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const interestIcons: Record<string, React.ReactNode> = {
    'Travel': <Plane className="w-4 h-4" />,
    'Music': <Music className="w-4 h-4" />,
    'Coffee': <Coffee className="w-4 h-4" />,
    'Photography': <CameraIcon className="w-4 h-4" />,
    'Reading': <Book className="w-4 h-4" />,
    'Cooking': <Palette className="w-4 h-4" />,
    'Gaming': <Gamepad2 className="w-4 h-4" />,
    'Fitness': <Dumbbell className="w-4 h-4" />,
    'Movies': <Film className="w-4 h-4" />,
    'Singing': <Mic className="w-4 h-4" />
  };

  const relationshipIntentions = [
    { value: 'looking_for_love', label: 'Looking for Love 💕' },
    { value: 'serious_only', label: 'Serious Only 💍' },
    { value: 'friends_first', label: 'Friends First 🤝' },
    { value: 'sugar_daddy', label: 'Sugar Daddy 👑' },
    { value: 'sugar_mommy', label: 'Sugar Mommy 👸' }
  ];

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: tempData.username,
          full_name: tempData.full_name,
          avatar_url: tempData.avatar_url,
          bio: tempData.bio,
          age: tempData.age,
          gender: tempData.gender,
          country: tempData.country,
          city: tempData.city,
          tribe: tempData.tribe,
          languages: tempData.languages,
          interests: tempData.interests,
          relationship_intention: tempData.relationship_intention,
          verification_level: tempData.verification_level,
          is_verified: tempData.is_verified,
          is_premium: tempData.is_premium,
          vip_tier: tempData.vip_tier,
          coins_balance: tempData.coins_balance,
          likes: tempData.likes,
          matches: tempData.matches,
          views: tempData.views,
          response_rate: tempData.response_rate,
          height: tempData.height,
          education: tempData.education,
          drinking: tempData.drinking,
          smoking: tempData.smoking,
          kids: tempData.kids,
          religion: tempData.religion,
          instagram: tempData.instagram,
          spotify: tempData.spotify,
          photos: tempData.photos,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (error) throw error;
      
      setProfileData(tempData);
      setIsEditing(false);
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Update Failed",
        description: "There was an error updating your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setTempData(profileData);
    setIsEditing(false);
  };

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'lovex/profiles');

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Upload failed');
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploadingAvatar(true);
    try {
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      const imageUrl = await uploadToCloudinary(file);

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          avatar_url: imageUrl,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (error) throw error;

      setProfileData(prev => ({ ...prev, avatar_url: imageUrl }));
      setTempData(prev => ({ ...prev, avatar_url: imageUrl }));

      toast({
        title: "Avatar Updated",
        description: "Your profile picture has been updated.",
        variant: "default",
      });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Check photo count
    const photoCount = await getPhotoCount(user.id);
    if (photoCount >= 6) {
      toast({
        title: "Maximum Photos Reached",
        description: "You can only upload up to 6 photos.",
        variant: "destructive",
      });
      return;
    }

    setUploadingPhoto(true);
    try {
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      const imageUrl = await uploadToCloudinary(file);

      // Check if this is the first photo
      const isFirst = photoCount === 0;

      // Save to database using the new photo system
      await addProfilePhoto(user.id, imageUrl, isFirst);

      // Refresh photos
      const updatedPhotos = await fetchUserPhotos(user.id);
      setProfileData(prev => ({ ...prev, photos: updatedPhotos }));
      setTempData(prev => ({ ...prev, photos: updatedPhotos }));

      toast({
        title: "Photo Uploaded",
        description: "Your photo has been successfully added.",
        variant: "default",
      });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async (index: number) => {
    setPhotoToDelete(index);
    setDeleteType('photo');
    setShowDeleteConfirm(true);
  };

  const handleDeleteAvatar = async () => {
    setDeleteType('avatar');
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!user) return;

    try {
      if (deleteType === 'avatar') {
        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            avatar_url: '',
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });

        if (error) throw error;

        setProfileData(prev => ({ ...prev, avatar_url: '' }));
        setTempData(prev => ({ ...prev, avatar_url: '' }));

        toast({
          title: "Avatar Removed",
          description: "Your profile picture has been removed.",
          variant: "default",
        });
      } else if (photoToDelete !== null) {
        const photoToDeleteObj = profileData.photos?.[photoToDelete];
        if (!photoToDeleteObj) return;
        
        await deletePhoto(user.id, photoToDeleteObj.id);
        
        // Refresh photos
        const updatedPhotos = await fetchUserPhotos(user.id);
        setProfileData(prev => ({ ...prev, photos: updatedPhotos }));
        setTempData(prev => ({ ...prev, photos: updatedPhotos }));

        toast({
          title: "Photo Deleted",
          description: "Your photo has been removed.",
          variant: "default",
        });
      }
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete. Please try again.",
        variant: "destructive",
      });
    } finally {
      setShowDeleteConfirm(false);
      setPhotoToDelete(null);
    }
  };

  const handleSetMainPhoto = async (index: number) => {
    const photoToSetAsMain = profileData.photos?.[index];
    if (!photoToSetAsMain || !user || photoToSetAsMain.is_main) return;
    
    try {
      // Show loading state
      toast({
        title: "Updating Profile Picture",
        description: "Setting your new profile picture...",
        variant: "default",
      });
      
      await setMainPhoto(user.id, photoToSetAsMain.id);
      
      // Refresh photos
      const updatedPhotos = await fetchUserPhotos(user.id);
      setProfileData(prev => ({ ...prev, photos: updatedPhotos }));
      setTempData(prev => ({ ...prev, photos: updatedPhotos }));
      
      toast({
        title: "Profile Picture Updated! 📸",
        description: "Your profile picture has been successfully updated.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error setting main photo:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update profile picture. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddInterest = (interest: string) => {
    if (!tempData.interests.includes(interest) && tempData.interests.length < 10) {
      setTempData({
        ...tempData,
        interests: [...tempData.interests, interest]
      });
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setTempData({
      ...tempData,
      interests: tempData.interests.filter(i => i !== interest)
    });
  };

  const handleAddLanguage = (language: string) => {
    if (!tempData.languages.includes(language) && tempData.languages.length < 5) {
      setTempData({
        ...tempData,
        languages: [...tempData.languages, language]
      });
    }
  };

  const handleRemoveLanguage = (language: string) => {
    setTempData({
      ...tempData,
      languages: tempData.languages.filter(l => l !== language)
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const input = { target: { files } } as React.ChangeEvent<HTMLInputElement>;
      await handlePhotoUpload(input);
    }
  };

  const getVipBadgeColor = (tier: string) => {
    switch (tier) {
      case 'premium': return 'from-purple-500 to-indigo-500';
      case 'platinum': return 'from-cyan-500 to-blue-500';
      case 'diamond': return 'from-yellow-400 to-amber-600';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-600" />
            <p className="text-gray-600">Loading your profile...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (!user) return null;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => navigate(-1)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-gray-900"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-xl font-semibold text-gray-900">My Profile</h1>
              </div>
              
              <div className="flex items-center gap-3">
                {!isEditing ? (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    size="sm"
                    className="border-gray-300"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      size="sm"
                      className="border-gray-300"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      size="sm"
                      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                  </div>
                )}
                
                <Link to="/settings">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <Settings className="w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Left Column - Photos & Profile Info */}
            <div className="xl:col-span-2 space-y-6">
              {/* Profile Card */}
              <Card className="border-0 shadow-sm overflow-hidden">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <div className="relative inline-block">
                      <Avatar className="w-24 h-24 mx-auto mb-3 ring-4 ring-purple-100">
                        <AvatarImage 
                          src={profileData.avatar_url || getMainPhotoUrl(profileData.photos)} 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '';
                          }}
                        />
                        <AvatarFallback className="text-2xl bg-gradient-to-br from-purple-600 to-pink-600 text-white">
                          {profileData.full_name?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <label
                        htmlFor="avatar-upload"
                        className="absolute bottom-0 right-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-purple-700 transition-colors"
                      >
                        {uploadingAvatar ? (
                          <Loader2 className="w-4 h-4 text-white animate-spin" />
                        ) : (
                          <Camera className="w-4 h-4 text-white" />
                        )}
                        <input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarUpload}
                          disabled={uploadingAvatar}
                        />
                      </label>

                      {profileData.avatar_url && (
                        <button
                          onClick={handleDeleteAvatar}
                          className="absolute top-0 right-0 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-white" />
                        </button>
                      )}
                      
                      {profileData.is_verified && verificationStatus?.badge_type && (
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                          <VerificationBadge 
                            level={verificationStatus.badge_type} 
                            size="sm" 
                            animated={true} 
                          />
                        </div>
                      )}
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 mb-1">
                      {profileData.full_name}, {profileData.age}
                    </h2>
                    
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-2">
                      <MapPin className="w-4 h-4" />
                      <span>{profileData.city}, {profileData.country}</span>
                    </div>

                    {/* Verification Status */}
                    <div className="flex items-center justify-center text-sm mb-4">
                      {profileData.is_verified && verificationStatus?.badge_type ? (
                        <div className="flex items-center gap-2">
                          <VerificationBadge 
                            level={verificationStatus.badge_type} 
                            size="sm" 
                            showTooltip={false}
                          />
                          <span className="text-green-600 font-medium">Verified</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-orange-600">
                          <AlertCircle className="w-4 h-4" />
                          <span>Not Verified</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* Photos Section */}
              <Card className="border-0 shadow-sm overflow-hidden">
                <CardHeader className="pb-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        Photos ({(profileData.photos || []).length}/6)
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Click the ⭐ star on any photo to set it as your profile picture
                      </p>
                    </div>
                    {(profileData.photos || []).length < 6 && (
                      <div>
                        <input
                          type="file"
                          id="photo-upload"
                          accept="image/*"
                          className="hidden"
                          onChange={handlePhotoUpload}
                          disabled={uploadingPhoto}
                        />
                        <label
                          htmlFor="photo-upload"
                          className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors cursor-pointer"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Add Photo
                        </label>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent 
                  className="p-6 relative"
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {dragActive && (
                    <div className="absolute inset-0 bg-purple-50 border-2 border-purple-500 border-dashed rounded-lg flex items-center justify-center pointer-events-none z-10">
                      <p className="text-purple-600 font-medium">Drop your photo here</p>
                    </div>
                  )}

                  {(profileData.photos || []).length === 0 ? (
                    <div 
                      onClick={() => document.getElementById('photo-upload')?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500 transition-colors"
                    >
                      <Camera className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-gray-600 font-medium mb-1">No photos yet</p>
                      <p className="text-sm text-gray-500">
                        Click or drag and drop to upload photos
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        JPG, PNG, GIF up to 5MB
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {(profileData.photos || []).map((photoObj, index) => (
                        <div key={photoObj.id} className="relative group aspect-square">
                          <img
                            src={photoObj.photo_url}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400?text=Image+Error';
                            }}
                          />
                          
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                            {!photoObj.is_main && (
                              <button
                                onClick={() => handleSetMainPhoto(index)}
                                className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-purple-600 hover:text-white transition-all transform hover:scale-110 shadow-lg"
                                title="Set as profile picture"
                              >
                                <StarIcon className="w-5 h-5" />
                              </button>
                            )}
                            {photoObj.is_main && (
                              <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
                                <StarIcon className="w-5 h-5 text-white" />
                              </div>
                            )}
                            <button
                              onClick={() => handleDeletePhoto(index)}
                              className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-white" />
                            </button>
                          </div>

                          {photoObj.is_main && (
                            <div className="absolute top-2 left-2">
                              <Badge className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white border-0 shadow-lg">
                                <StarIcon className="w-3 h-3 mr-1" />
                                Profile Picture
                              </Badge>
                            </div>
                          )}
                        </div>
                      ))}

                      {(profileData.photos || []).length < 6 && (
                        <label
                          htmlFor="photo-upload-more"
                          className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 transition-colors"
                        >
                          <Plus className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-500">Add More</span>
                          <input
                            id="photo-upload-more"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePhotoUpload}
                            disabled={uploadingPhoto}
                          />
                        </label>
                      )}
                    </div>
                  )}

                  <p className="text-sm text-gray-500 mt-4">
                    First photo will be your main profile picture. You can upload up to 6 photos.
                  </p>
                </CardContent>
              </Card>

              {/* Profile Tabs */}
              <Card className="border-0 shadow-sm overflow-hidden">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <div className="px-6 pt-6">
                    <TabsList className="w-full justify-start bg-gray-100 p-1">
                      <TabsTrigger value="about" className="flex-1">About</TabsTrigger>
                      <TabsTrigger value="interests" className="flex-1">Interests</TabsTrigger>
                      <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
                    </TabsList>
                  </div>

                  {/* About Tab */}
                  <TabsContent value="about" className="p-6 pt-4">
                    {isEditing ? (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="full_name">Full Name</Label>
                          <Input
                            id="full_name"
                            value={tempData.full_name}
                            onChange={(e) => setTempData({ ...tempData, full_name: e.target.value })}
                            className="border-gray-300"
                          />
                        </div>
                        <div>
                          <Label htmlFor="username">Username</Label>
                          <Input
                            id="username"
                            value={tempData.username}
                            onChange={(e) => setTempData({ ...tempData, username: e.target.value })}
                            className="border-gray-300"
                          />
                        </div>
                        <div>
                          <Label htmlFor="age">Age</Label>
                          <Input
                            id="age"
                            type="number"
                            value={tempData.age}
                            onChange={(e) => setTempData({ ...tempData, age: parseInt(e.target.value) })}
                            className="border-gray-300"
                          />
                        </div>
                        <div>
                          <Label htmlFor="gender">Gender</Label>
                          <Select 
                            value={tempData.gender}
                            onValueChange={(value) => setTempData({ ...tempData, gender: value })}
                          >
                            <SelectTrigger id="gender" className="border-gray-300">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="bio">Bio</Label>
                          <Textarea
                            id="bio"
                            value={tempData.bio}
                            onChange={(e) => setTempData({ ...tempData, bio: e.target.value })}
                            rows={4}
                            className="border-gray-300 resize-none"
                            maxLength={500}
                          />
                          <p className="text-sm text-gray-500 mt-1">
                            {tempData.bio.length}/500 characters
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="country">Country</Label>
                          <Input
                            id="country"
                            value={tempData.country}
                            onChange={(e) => setTempData({ ...tempData, country: e.target.value })}
                            className="border-gray-300"
                          />
                        </div>
                        <div>
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            value={tempData.city}
                            onChange={(e) => setTempData({ ...tempData, city: e.target.value })}
                            className="border-gray-300"
                          />
                        </div>
                        <div>
                          <Label htmlFor="tribe">Tribe/Ethnicity</Label>
                          <Input
                            id="tribe"
                            value={tempData.tribe}
                            onChange={(e) => setTempData({ ...tempData, tribe: e.target.value })}
                            className="border-gray-300"
                          />
                        </div>
                        <div>
                          <Label htmlFor="languages">Languages</Label>
                          <Select onValueChange={handleAddLanguage}>
                            <SelectTrigger id="languages" className="border-gray-300">
                              <SelectValue placeholder="Add a language..." />
                            </SelectTrigger>
                            <SelectContent>
                              {languagesList.map((language) => (
                                <SelectItem 
                                  key={language} 
                                  value={language}
                                  disabled={tempData.languages.includes(language) || tempData.languages.length >= 5}
                                >
                                  {language}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {tempData.languages.map((lang) => (
                              <Badge
                                key={lang}
                                className="px-3 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors group cursor-pointer"
                                onClick={() => handleRemoveLanguage(lang)}
                              >
                                {lang}
                                <X className="w-3 h-3 ml-1 inline opacity-0 group-hover:opacity-100 transition-opacity" />
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-2">Bio</h3>
                          <p className="text-gray-900 leading-relaxed">{profileData.bio}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-1">Location</h3>
                            <p className="text-gray-900">{profileData.city}, {profileData.country}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-1">Tribe</h3>
                            <p className="text-gray-900">{profileData.tribe || 'Not specified'}</p>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-2">Languages</h3>
                          <div className="flex flex-wrap gap-2">
                            {profileData.languages.map((lang) => (
                              <Badge key={lang} variant="secondary" className="bg-gray-100 text-gray-700">
                                {lang}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* Interests Tab */}
                  <TabsContent value="interests" className="p-6 pt-4">
                    {isEditing ? (
                      <div>
                        <div className="mb-4">
                          <Label htmlFor="interest-select">Add Interests</Label>
                          <Select onValueChange={handleAddInterest}>
                            <SelectTrigger id="interest-select" className="border-gray-300">
                              <SelectValue placeholder="Select an interest..." />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.keys(interestIcons).map((interest) => (
                                <SelectItem 
                                  key={interest} 
                                  value={interest}
                                  disabled={tempData.interests.includes(interest) || tempData.interests.length >= 10}
                                >
                                  <div className="flex items-center gap-2">
                                    {interestIcons[interest]}
                                    {interest}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label>Your Interests ({tempData.interests.length}/10)</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {tempData.interests.map((interest) => (
                              <Badge
                                key={interest}
                                className="px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors group cursor-pointer"
                                onClick={() => handleRemoveInterest(interest)}
                              >
                                <div className="flex items-center gap-1">
                                  {interestIcons[interest]}
                                  {interest}
                                  <X className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </Badge>
                            ))}
                            {tempData.interests.length === 0 && (
                              <p className="text-sm text-gray-500">No interests selected</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-3">Interests</h3>
                        <div className="flex flex-wrap gap-2">
                          {profileData.interests.map((interest) => (
                            <Badge
                              key={interest}
                              className="px-3 py-1.5 bg-gray-100 text-gray-700"
                            >
                              <div className="flex items-center gap-1">
                                {interestIcons[interest]}
                                {interest}
                              </div>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* Details Tab */}
                  <TabsContent value="details" className="p-6 pt-4">
                    {isEditing ? (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="relationship">Relationship Intention</Label>
                          <Select 
                            value={tempData.relationship_intention}
                            onValueChange={(value: any) => setTempData({ ...tempData, relationship_intention: value })}
                          >
                            <SelectTrigger id="relationship" className="border-gray-300">
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
                        <div>
                          <Label htmlFor="height">Height (cm)</Label>
                          <Input
                            id="height"
                            type="number"
                            value={tempData.height || ''}
                            onChange={(e) => setTempData({ ...tempData, height: parseInt(e.target.value) })}
                            className="border-gray-300"
                          />
                        </div>
                        <div>
                          <Label htmlFor="education">Education</Label>
                          <Input
                            id="education"
                            value={tempData.education || ''}
                            onChange={(e) => setTempData({ ...tempData, education: e.target.value })}
                            className="border-gray-300"
                          />
                        </div>
                        <div>
                          <Label htmlFor="drinking">Drinking</Label>
                          <Select 
                            value={tempData.drinking}
                            onValueChange={(value) => setTempData({ ...tempData, drinking: value })}
                          >
                            <SelectTrigger id="drinking" className="border-gray-300">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Never">Never</SelectItem>
                              <SelectItem value="Socially">Socially</SelectItem>
                              <SelectItem value="Regularly">Regularly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="smoking">Smoking</Label>
                          <Select 
                            value={tempData.smoking}
                            onValueChange={(value) => setTempData({ ...tempData, smoking: value })}
                          >
                            <SelectTrigger id="smoking" className="border-gray-300">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Never">Never</SelectItem>
                              <SelectItem value="Socially">Socially</SelectItem>
                              <SelectItem value="Regularly">Regularly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="kids">Kids</Label>
                          <Select 
                            value={tempData.kids}
                            onValueChange={(value) => setTempData({ ...tempData, kids: value })}
                          >
                            <SelectTrigger id="kids" className="border-gray-300">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Don't want">Don't want</SelectItem>
                              <SelectItem value="Want someday">Want someday</SelectItem>
                              <SelectItem value="Have kids">Have kids</SelectItem>
                              <SelectItem value="Open to kids">Open to kids</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="instagram">Instagram</Label>
                          <Input
                            id="instagram"
                            value={tempData.instagram || ''}
                            onChange={(e) => setTempData({ ...tempData, instagram: e.target.value })}
                            className="border-gray-300"
                            placeholder="@username"
                          />
                        </div>
                        <div>
                          <Label htmlFor="spotify">Spotify</Label>
                          <Input
                            id="spotify"
                            value={tempData.spotify || ''}
                            onChange={(e) => setTempData({ ...tempData, spotify: e.target.value })}
                            className="border-gray-300"
                            placeholder="username"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-1">Looking for</h3>
                            <p className="text-gray-900">
                              {relationshipIntentions.find(i => i.value === profileData.relationship_intention)?.label}
                            </p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-1">Height</h3>
                            <p className="text-gray-900">{profileData.height} cm</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-1">Education</h3>
                            <p className="text-gray-900">{profileData.education}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-1">Drinking</h3>
                            <p className="text-gray-900">{profileData.drinking}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-1">Smoking</h3>
                            <p className="text-gray-900">{profileData.smoking}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-1">Kids</h3>
                            <p className="text-gray-900">{profileData.kids}</p>
                          </div>
                        </div>
                        {(profileData.instagram || profileData.spotify) && (
                          <div className="pt-4 border-t border-gray-200">
                            <h3 className="text-sm font-medium text-gray-500 mb-2">Social</h3>
                            <div className="space-y-2">
                              {profileData.instagram && (
                                <div className="flex items-center gap-2 text-sm">
                                  <CameraIcon className="w-4 h-4 text-gray-400" />
                                  <span className="text-gray-600">{profileData.instagram}</span>
                                </div>
                              )}
                              {profileData.spotify && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Music className="w-4 h-4 text-gray-400" />
                                  <span className="text-gray-600">{profileData.spotify}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </Card>
            </div>

            {/* Right Column - Stats & Actions */}
            <div className="space-y-6">
              {/* Stats Card */}
              <Card className="border-0 shadow-sm overflow-hidden">
                <CardContent className="p-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-4 text-center mb-6">
                    <div>
                      <div className="text-xl font-bold text-gray-900">{profileData.likes || 0}</div>
                      <div className="text-xs text-gray-500">Likes</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-gray-900">{profileData.matches || 0}</div>
                      <div className="text-xs text-gray-500">Matches</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-gray-900">{profileData.views || 0}</div>
                      <div className="text-xs text-gray-500">Views</div>
                    </div>
                  </div>

                  {/* VIP Status */}
                  {profileData.vip_tier !== 'free' && (
                    <div className="text-center mb-6">
                      <Badge className={`bg-gradient-to-r ${getVipBadgeColor(profileData.vip_tier)} text-white border-0 px-3 py-1`}>
                        {profileData.vip_tier.toUpperCase()} MEMBER
                      </Badge>
                    </div>
                  )}

                  {/* Consolidated Verification Section */}
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="font-semibold text-gray-900 mb-2">Verification Status</h3>
                      {profileData.is_verified && verificationStatus?.badge_type ? (
                        <div className="space-y-3">
                          <div className="flex justify-center">
                            <VerificationBadge 
                              level={verificationStatus.badge_type} 
                              size="lg" 
                              animated={true} 
                            />
                          </div>
                          <div className="text-sm text-green-600 font-medium">
                            ✓ Verified {verificationStatus.badge_type} User
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-center gap-2 text-orange-600">
                            <AlertCircle className="w-5 h-5" />
                            <span className="font-medium">Not Verified</span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Get verified to build trust and get more matches
                          </p>
                        </div>
                      )}
                    </div>

                    {!profileData.is_verified && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                            <Shield className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-purple-900">Get Verified</h4>
                            <p className="text-xs text-purple-700">
                              Verify your identity to get more matches
                            </p>
                          </div>
                        </div>
                        <Link to="/verification">
                          <Button className="w-full bg-purple-600 text-white hover:bg-purple-700">
                            <Camera className="w-4 h-4 mr-2" />
                            Get Verified Now
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border-0 shadow-sm overflow-hidden">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <VerificationGate feature="matching">
                      <Link to="/matching">
                        <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700">
                          <Heart className="w-4 h-4 mr-2" />
                          Start Matching
                        </Button>
                      </Link>
                    </VerificationGate>
                    
                    <VerificationGate feature="messaging">
                      <Link to="/chat">
                        <Button variant="outline" className="w-full border-gray-300">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Messages
                        </Button>
                      </Link>
                    </VerificationGate>
                    
                    <Link to="/gifts">
                      <Button variant="outline" className="w-full border-gray-300">
                        <Gift className="w-4 h-4 mr-2" />
                        Gift Store
                      </Button>
                    </Link>
                    
                    <Link to="/settings">
                      <Button variant="outline" className="w-full border-gray-300">
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Member Info */}
              <Card className="border-0 shadow-sm overflow-hidden">
                <CardHeader className="pb-3 border-b border-gray-200">
                  <CardTitle className="text-sm font-semibold text-gray-900">
                    Member Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Member since</span>
                      <span className="text-gray-900 font-medium">
                        {formatDate(profileData.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Response rate</span>
                      <span className="text-gray-900 font-medium">{profileData.response_rate || 0}%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Coins balance</span>
                      <span className="text-gray-900 font-medium">{profileData.coins_balance || 0} LX</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {deleteType === 'avatar' ? 'Remove Profile Picture?' : 'Delete Photo?'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {deleteType === 'avatar' 
                  ? 'Are you sure you want to remove your profile picture?'
                  : 'This action cannot be undone. This photo will be permanently deleted.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AuthGuard>
  );
};

export default Profile;