import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

// Cache for profile data to avoid repeated queries
const profileCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Extended User interface to include all properties used in the app
export interface AppUser {
  id: string;
  email?: string;
  full_name?: string;
  username?: string;
  avatar_url?: string;
  age?: number;
  city?: string;
  country?: string;
  bio?: string;
  interests?: string[];
  is_verified?: boolean;
  verification_level?: string;
  vip_tier?: string;
  coins_balance?: number;
  is_online?: boolean;
  is_admin?: boolean;
  created_at?: string;
}

interface AuthState {
  user: User | null;
  userProfile: AppUser | null;
  userRole: 'user' | 'premium' | 'admin';
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    userProfile: null,
    userRole: 'user',
    isLoading: true,
    isAuthenticated: false
  });

  // Memoize the auth state to prevent unnecessary re-renders
  const authStateMemo = useMemo(() => authState, [authState.user?.id, authState.isAuthenticated, authState.isLoading]);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Set basic auth state immediately, then fetch profile
          setAuthState({
            user: session.user,
            userProfile: null,
            userRole: 'user',
            isLoading: true, // Keep loading while fetching profile
            isAuthenticated: true
          });
          
          // Fetch profile in background
          fetchUserProfile(session.user);
        } else {
          setAuthState({
            user: null,
            userProfile: null,
            userRole: 'user',
            isLoading: false,
            isAuthenticated: false
          });
        }
      } catch (error) {
        console.error('Session check failed:', error);
        setAuthState({
          user: null,
          userProfile: null,
          userRole: 'user',
          isLoading: false,
          isAuthenticated: false
        });
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Set basic auth state immediately
          setAuthState(prev => ({
            ...prev,
            user: session.user,
            isAuthenticated: true,
            isLoading: true
          }));
          
          // Fetch profile in background
          fetchUserProfile(session.user);
        } else {
          setAuthState({
            user: null,
            userProfile: null,
            userRole: 'user',
            isLoading: false,
            isAuthenticated: false
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = useCallback(async (user: User, retryCount = 0) => {
    // Check cache first
    const cached = profileCache.get(user.id);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      let role: 'user' | 'premium' | 'admin' = 'user';
      
      if (cached.data?.is_admin) {
        role = 'admin';
      } else if (cached.data?.vip_tier && cached.data.vip_tier !== 'free') {
        role = 'premium';
      }

      setAuthState({
        user,
        userProfile: cached.data as AppUser,
        userRole: role,
        isLoading: false,
        isAuthenticated: true
      });
      return;
    }

    try {
      // Add timeout with retry logic
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 10000) // Increased to 10 seconds
      );

      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const { data: profile, error } = await Promise.race([profilePromise, timeoutPromise]) as any;
      
      if (error) {
        // If profile doesn't exist, create a basic one
        if (error.code === 'PGRST116') {
          console.log('Profile not found, creating basic profile...');
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              username: user.email?.split('@')[0] || 'user',
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
              vip_tier: 'free',
              coins_balance: 0,
              is_verified: false
            })
            .select('*')
            .single();

          if (!createError && newProfile) {
            profileCache.set(user.id, { data: newProfile, timestamp: Date.now() });
            setAuthState({
              user,
              userProfile: newProfile as AppUser,
              userRole: 'user',
              isLoading: false,
              isAuthenticated: true
            });
            return;
          }
        }
        throw error;
      }

      // Cache the result
      profileCache.set(user.id, { data: profile, timestamp: Date.now() });

      let role: 'user' | 'premium' | 'admin' = 'user';
      
      if (profile?.is_admin) {
        role = 'admin';
      } else if (profile?.vip_tier && profile.vip_tier !== 'free') {
        role = 'premium';
      }

      setAuthState({
        user,
        userProfile: profile as AppUser,
        userRole: role,
        isLoading: false,
        isAuthenticated: true
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      
      // Retry logic for timeouts
      if (error.message === 'Profile fetch timeout' && retryCount < 2) {
        console.log(`Retrying profile fetch... Attempt ${retryCount + 1}`);
        setTimeout(() => fetchUserProfile(user, retryCount + 1), 1000 * (retryCount + 1));
        return;
      }
      
      // Set basic auth state even if profile fetch fails
      setAuthState({
        user,
        userProfile: null,
        userRole: 'user',
        isLoading: false,
        isAuthenticated: true
      });
    }
  }, []);

  const signOut = async () => {
    // Clear cache on sign out
    profileCache.clear();
    await supabase.auth.signOut();
  };

  const updateUser = async (updates: any) => {
    try {
      const { data, error } = await supabase.auth.updateUser(updates);
      if (error) throw error;
      
      // Invalidate cache when user is updated
      if (authState.user?.id) {
        profileCache.delete(authState.user.id);
      }
      
      return data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  return {
    ...authStateMemo,
    signOut,
    updateUser
  };
}
