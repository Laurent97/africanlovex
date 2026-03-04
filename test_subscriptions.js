import { createClient } from '@supabase/supabase-js';

// Use the actual URL and key from .env
const supabase = createClient(
  'https://awkmzllzstmphnzlygzu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3a216bGx6c3RtcGhuemx5Z3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0Mzg3ODksImV4cCI6MjA4ODAxNDc4OX0.MFjgY19VERNY8-3yT7aTQEOc62c6p96DFtkSRYcP-fE'
);

async function testSubscriptions() {
  console.log('Testing subscriptions table access...');
  
  try {
    // Test basic select
    console.log('\n1. Testing basic select...');
    const { data: basicData, error: basicError } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(1);
    
    if (basicError) {
      console.log('Basic select error:', basicError);
    } else {
      console.log('Basic select success, rows:', basicData?.length || 0);
    }

    // Test with user_id filter
    console.log('\n2. Testing with user_id filter...');
    const { data: userData, error: userError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', '3bc03b90-8def-4ffd-80ef-12bfdbfa183d');
    
    if (userError) {
      console.log('User filter error:', userError);
      console.log('Error details:', userError.details);
    } else {
      console.log('User filter success, rows:', userData?.length || 0);
    }

    // Test the exact query that's failing
    console.log('\n3. Testing exact failing query...');
    const { data: exactData, error: exactError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', '3bc03b90-8def-4ffd-80ef-12bfdbfa183d')
      .eq('status', 'active');
    
    if (exactError) {
      console.log('Exact query error:', exactError);
      console.log('Error code:', exactError.code);
      console.log('Error message:', exactError.message);
      console.log('Error details:', exactError.details);
    } else {
      console.log('Exact query success, rows:', exactData?.length || 0);
    }

  } catch (err) {
    console.log('Exception:', err.message);
  }
}

testSubscriptions();
