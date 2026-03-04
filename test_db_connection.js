// RLS Fix using direct SQL execution
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = 'https://awkmzllzstmphnzlygzu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3a216bGx6c3RtcGhuemx5Z3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0Mzg3ODksImV4cCI6MjA4ODAxNDc4OX0.MFjgY19VERNY8-3yT7aTQEOc62c6p96DFtkSRYcP-fE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runRLSFix() {
  try {
    console.log('Running RLS policies fix...');
    
    // Read the migration file
    const migrationSQL = readFileSync(join(process.cwd(), 'database/fix_rls_policies.sql'), 'utf8');
    
    console.log('Migration file loaded successfully');
    console.log('SQL content preview:', migrationSQL.substring(0, 200) + '...');
    
    // For now, let's just test basic connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      console.error('Connection test failed:', error);
      return;
    }
    
    console.log('✓ Database connection successful');
    console.log('⚠️  Note: You may need to run the SQL manually in your Supabase dashboard:');
    console.log('   1. Go to https://supabase.com/dashboard/project/awkmzllzstmphnzlygzu');
    console.log('   2. Navigate to SQL Editor');
    console.log('   3. Copy and paste the contents of database/fix_rls_policies.sql');
    console.log('   4. Run the script');
    
  } catch (error) {
    console.error('Migration setup failed:', error);
  }
}

runRLSFix();
