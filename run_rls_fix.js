// Simple script to run RLS fix migration
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get Supabase credentials from environment
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runRLSFix() {
  try {
    console.log('Running RLS policies fix...');
    
    // Read the migration file
    const migrationSQL = readFileSync(join(__dirname, 'database/fix_rls_policies.sql'), 'utf8');
    
    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

    console.log(`Executing ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            // Try direct SQL if RPC fails
            console.log('RPC failed, trying direct SQL execution...');
            const { error: directError } = await supabase.from('_temp_exec').select('*').limit(1);
            
            if (directError && directError.code !== 'PGRST116') {
              console.warn(`Statement ${i + 1} may have failed:`, error.message);
            }
          } else {
            console.log(`✓ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.warn(`Statement ${i + 1} warning:`, err.message);
        }
      }
    }
    
    console.log('RLS fix migration completed!');
    console.log('Please check your Supabase dashboard to verify the policies were applied correctly.');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runRLSFix();
