import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

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
  created_at?: string;
}

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user as AppUser ?? null);
        setIsAuthenticated(!!session?.user);
      } catch (error) {
        console.error('Session check failed:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user as AppUser ?? null);
        setIsAuthenticated(!!session?.user);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return {
    user,
    loading,
    isAuthenticated,
  };
}
