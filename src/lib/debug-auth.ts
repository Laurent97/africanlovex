import { supabase } from '@/lib/supabase';

export const debugAuth = async () => {
  console.log('=== Auth Debug Info ===');
  
  try {
    // Check current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('Session:', session);
    console.log('Session Error:', sessionError);
    
    // Check current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('User:', user);
    console.log('User Error:', userError);
    
    // Check localStorage
    if (typeof window !== 'undefined') {
      const authKeys = Object.keys(localStorage).filter(key => key.includes('supabase') || key.includes('auth'));
      console.log('LocalStorage auth keys:', authKeys);
      authKeys.forEach(key => {
        console.log(`${key}:`, localStorage.getItem(key));
      });
    }
    
    return { session, user, sessionError, userError };
  } catch (error) {
    console.error('Debug error:', error);
    return { error };
  }
};

export const testAuthFlow = async () => {
  console.log('=== Testing Auth Flow ===');
  
  // Test 1: Check if we can get session
  const sessionResult = await supabase.auth.getSession();
  console.log('1. Get session result:', sessionResult);
  
  // Test 2: Try to get user
  const userResult = await supabase.auth.getUser();
  console.log('2. Get user result:', userResult);
  
  // Test 3: Check if auth is configured properly
  console.log('3. Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('4. Has anon key:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
  
  return { sessionResult, userResult };
};
