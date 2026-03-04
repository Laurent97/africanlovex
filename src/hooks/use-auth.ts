import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

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

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await fetchUserProfile(session.user);
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
          await fetchUserProfile(session.user);
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

  const fetchUserProfile = async (user: User) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

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
      // Set basic auth state even if profile fetch fails
      setAuthState({
        user,
        userProfile: null,
        userRole: 'user',
        isLoading: false,
        isAuthenticated: true
      });
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const updateUser = async (updates: any) => {
    try {
      const { data, error } = await supabase.auth.updateUser(updates);
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  return {
    ...authState,
    signOut,
    updateUser
  };
}
