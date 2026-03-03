// Test script to verify photo system works
import { supabase } from './src/lib/supabase.js';

async function testPhotoSystem() {
  try {
    console.log('Testing photo system...');
    
    // Test if we can create a simple table
    const { error } = await supabase
      .from('profile_photos')
      .select('count')
      .single();
    
    if (error) {
      console.log('Table does not exist yet, error:', error.message);
      console.log('You need to run the migration first.');
      console.log('Please run the SQL in database/profile_photos_migration.sql manually in your Supabase dashboard.');
    } else {
      console.log('Photo system is ready!');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testPhotoSystem();
