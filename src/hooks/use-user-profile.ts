import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import { supabase } from '@/lib/supabase';

interface UserProfile {
  id: string;
  name: string;
  age: number;
  bio: string;
  location: string;
  city: string;
  country: string;
  occupation: string;
  photos: string[];
  avatar: string;
  interests: string[];
  verified: boolean;
  verificationLevel: 'basic' | 'standard' | 'premium';
  vipTier: 'basic' | 'love' | 'premium' | 'platinum' | 'diamond';
  stats: {
    likes: number;
    matches: number;
    views: number;
    responseRate: number;
    memberSince: Date;
  };
  languages: string[];
  relationshipIntention: 'looking_for_love' | 'serious_only' | 'friends_first' | 'casual_dating';
  height?: number;
  education?: string;
  drinking?: string;
  smoking?: string;
  kids?: string;
  religion?: string;
  instagram?: string;
  spotify?: string;
}

export const useUserProfile = (userId: string | undefined) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Fetch from Supabase
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
          throw error;
        }

        if (profileData) {
          setProfile(profileData);
        } else {
          // Create default profile if none exists
          const defaultProfile: UserProfile = {
            id: userId,
            name: user?.displayName || 'User',
            age: 28,
            bio: 'Passionate about connecting with meaningful people. Love exploring new cultures and sharing experiences.',
            location: 'Kigali, Rwanda',
            city: 'Kigali',
            country: 'Rwanda',
            occupation: 'Product Designer',
            photos: [],
            avatar: '',
            interests: ['Travel', 'Music', 'Coffee', 'Photography', 'Reading', 'Cooking'],
            verified: false,
            verificationLevel: 'basic',
            vipTier: 'basic',
            stats: {
              likes: 0,
              matches: 0,
              views: 0,
              responseRate: 0,
              memberSince: new Date()
            },
            languages: ['English'],
            relationshipIntention: 'looking_for_love',
            height: 175,
            education: "Bachelor's Degree",
            drinking: 'Socially',
            smoking: 'Never',
            kids: 'Want someday',
            religion: 'Spiritual',
            instagram: '',
            spotify: ''
          };

          // Insert default profile
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert(defaultProfile)
            .select()
            .single();

          if (insertError) {
            throw insertError;
          }

          setProfile(newProfile);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [userId, user?.displayName]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!profile) return false;
    
    try {
      const updatedProfile = { ...profile, ...updates };
      
      // Update Supabase
      const { error } = await supabase
        .from('profiles')
        .update(updatedProfile)
        .eq('id', profile.id);

      if (error) {
        throw error;
      }
      
      // Update local state
      setProfile(updatedProfile);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      return false;
    }
  };

  const saveProfileToBackend = async (profileData: UserProfile) => {
    try {
      // Get current session for auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      // Save to your backend API
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(profileData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save profile to backend');
      }
      
      return await response.json();
    } catch (err) {
      console.error('Backend save error:', err);
      throw err;
    }
  };

  const uploadPhoto = async (file: File) => {
    if (!profile) return null;
    
    try {
      // Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'lovexeastafrica');
      formData.append('folder', 'lovex/profiles');
      
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to upload to Cloudinary');
      }
      
      const data = await response.json();
      const imageUrl = data.secure_url;
      
      // Update profile with new Cloudinary URL
      const newPhotos = [...profile.photos, imageUrl];
      const updatedProfile = { ...profile, photos: newPhotos };
      
      // Save to Supabase
      const { error } = await supabase
        .from('profiles')
        .update({ photos: newPhotos })
        .eq('id', profile.id);

      if (error) {
        throw error;
      }
      
      // Update local state
      setProfile(updatedProfile);
      
      return imageUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photo');
      return null;
    }
  };

  const deletePhoto = async (index: number) => {
    if (!profile) return false;
    
    try {
      // Remove from profile array
      const newPhotos = profile.photos.filter((_, i) => i !== index);
      const updatedProfile = { ...profile, photos: newPhotos };
      
      // Update Supabase
      const { error } = await supabase
        .from('profiles')
        .update({ photos: newPhotos })
        .eq('id', profile.id);

      if (error) {
        throw error;
      }
      
      // Update local state
      setProfile(updatedProfile);
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete photo');
      return false;
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!profile) return null;
    
    try {
      // Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'lovexeastafrica');
      formData.append('folder', 'lovex/avatars');
      
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to upload to Cloudinary');
      }
      
      const data = await response.json();
      const imageUrl = data.secure_url;
      
      // Update profile with new avatar URL
      const updatedProfile = { ...profile, avatar: imageUrl };
      
      // Save to Supabase
      const { error } = await supabase
        .from('profiles')
        .update({ avatar: imageUrl })
        .eq('id', profile.id);

      if (error) {
        throw error;
      }
      
      // Update local state
      setProfile(updatedProfile);
      
      return imageUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload avatar');
      return null;
    }
  };

  const deleteAvatar = async () => {
    if (!profile) return false;
    
    try {
      // Update profile to remove avatar
      const updatedProfile = { ...profile, avatar: '' };
      
      // Update Supabase
      const { error } = await supabase
        .from('profiles')
        .update({ avatar: '' })
        .eq('id', profile.id);

      if (error) {
        throw error;
      }
      
      // Update local state
      setProfile(updatedProfile);
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete avatar');
      return false;
    }
  };

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    uploadPhoto,
    deletePhoto,
    uploadAvatar,
    deleteAvatar
  };
};