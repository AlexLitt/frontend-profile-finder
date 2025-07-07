import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables (need SUPABASE_SERVICE_KEY)');
  process.exit(1);
}

// Create Supabase admin client
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function runSqlFile(sqlFile) {
  try {
    console.log(`Running SQL file: ${sqlFile}...`);
    
    // Read the SQL file
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    // Split into individual statements (naive approach, but works for our simple scripts)
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    // Execute each statement
    for (const statement of statements) {
      const { data, error } = await supabaseAdmin.from('_sqlexecution').select('*').then(() => {
        // This is a hack to get access to the raw query execution
        const query = supabaseAdmin.from('_sqlexecution')['_rpc'];
        return query(statement);
      });
      
      if (error) {
        console.error(`❌ SQL execution failed:`, error.message);
        console.error('Failed statement:', statement);
        throw error;
      }
    }
    
    console.log(`✅ Successfully executed ${sqlFile}`);
    
  } catch (error) {
    console.error(`❌ Error executing ${sqlFile}:`, error.message);
    throw error;
  }
}

async function main() {
  try {
    // Get the SQL file from command line args
    const sqlFile = process.argv[2];
    if (!sqlFile) {
      console.error('Please provide an SQL file to run');
      process.exit(1);
    }

    // Run the specified SQL file
    await runSqlFile(sqlFile);
    console.log('✅ SQL execution completed successfully');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
