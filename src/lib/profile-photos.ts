// Photo management types and functions for LoveX profiles
export interface ProfilePhoto {
  id: string;
  photo_url: string;
  is_main: boolean;
  photo_position: number;
  created_at: string;
}

export interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  bio: string;
  age: number;
  gender: string;
  country: string;
  city: string;
  tribe: string;
  languages: string[];
  interests: string[];
  relationship_intention: 'looking_for_love' | 'serious_only' | 'friends_first' | 'sugar_daddy' | 'sugar_mommy';
  verification_level: 'basic' | 'standard' | 'premium';
  is_verified: boolean;
  is_premium: boolean;
  vip_tier: 'free' | 'basic' | 'premium' | 'platinum' | 'diamond';
  coins_balance: number;
  created_at: string;
  updated_at: string;
  
  // Stats fields
  likes?: number;
  matches?: number;
  views?: number;
  response_rate?: number;
  
  // Optional fields
  height?: number;
  education?: string;
  drinking?: string;
  smoking?: string;
  kids?: string;
  religion?: string;
  instagram?: string;
  spotify?: string;
  
  // Photos are now properly structured
  photos?: ProfilePhoto[];
}

// Photo management functions
import { supabase } from './supabase';

export const fetchUserPhotos = async (userId: string): Promise<ProfilePhoto[]> => {
  const { data, error } = await supabase
    .rpc('get_user_photos', { user_uuid: userId });

  if (error) {
    console.error('Error fetching photos:', error);
    return [];
  }

  return data || [];
};

export const addProfilePhoto = async (
  userId: string, 
  photoUrl: string, 
  isMain: boolean = false
): Promise<ProfilePhoto> => {
  const { data, error } = await supabase
    .rpc('add_profile_photo', { 
      user_uuid: userId, 
      photo_url: photoUrl, 
      is_main: isMain 
    });

  if (error) {
    console.error('Error adding photo:', error);
    throw error;
  }

  // Return the newly created photo
  const photos = await fetchUserPhotos(userId);
  const newPhoto = photos.find(p => p.id === data);
  if (!newPhoto) {
    throw new Error('Failed to retrieve newly created photo');
  }

  return newPhoto;
};

export const setMainPhoto = async (userId: string, photoId: string): Promise<void> => {
  const { error } = await supabase
    .rpc('set_main_photo', { 
      user_uuid: userId, 
      photo_id: photoId 
    });

  if (error) {
    console.error('Error setting main photo:', error);
    throw error;
  }
};

export const deletePhoto = async (userId: string, photoId: string): Promise<void> => {
  const { error } = await supabase
    .rpc('delete_profile_photo', { 
      user_uuid: userId, 
      photo_id: photoId 
    });

  if (error) {
    console.error('Error deleting photo:', error);
    throw error;
  }
};

export const reorderPhotos = async (userId: string, photoIds: string[]): Promise<void> => {
  const { error } = await supabase
    .rpc('reorder_photos', { 
      user_uuid: userId, 
      photo_ids: photoIds 
    });

  if (error) {
    console.error('Error reordering photos:', error);
    throw error;
  }
};

export const getPhotoCount = async (userId: string): Promise<number> => {
  const { data, error } = await supabase
    .rpc('get_photo_count', { user_uuid: userId });

  if (error) {
    console.error('Error getting photo count:', error);
    return 0;
  }

  return data || 0;
};

// Helper function to get main photo URL
export const getMainPhotoUrl = (photos?: ProfilePhoto[]): string | null => {
  if (!photos || photos.length === 0) return null;
  
  const mainPhoto = photos.find(p => p.is_main);
  if (mainPhoto) return mainPhoto.photo_url;
  
  // If no main photo, return the first one
  return photos[0].photo_url;
};

// Helper function to get photo URLs array (for backward compatibility)
export const getPhotoUrls = (photos?: ProfilePhoto[]): string[] => {
  if (!photos || photos.length === 0) return [];
  
  return photos
    .sort((a, b) => {
      // Sort by main status first, then by position
      if (a.is_main && !b.is_main) return -1;
      if (!a.is_main && b.is_main) return 1;
      return a.photo_position - b.photo_position;
    })
    .map(p => p.photo_url);
};
