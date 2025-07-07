// run-migration.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Get the migration SQL file
const migrationFile = path.resolve(__dirname, '../supabase/migrations/20250704120000_create_user_profiles.sql');
const migrationSql = fs.readFileSync(migrationFile, 'utf8');

// Create a Supabase client with admin privileges
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('Running migration...');
  
  try {
    // Split the migration into individual statements
    const statements = migrationSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt); // Remove empty statements
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { data, error } = await supabase.rpc('pgmigration', { 
          query: stmt + ';'
        });
        
        if (error) {
          console.error(`Error executing statement ${i + 1}:`, error);
        } else {
          console.log(`Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.error(`Error executing statement ${i + 1}:`, err.message);
      }
    }
    
    console.log('Migration completed');
    
    // After migration, let's create the admin user
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .upsert([
        { 
          id: (await supabase.auth.admin.getUserById(process.env.ADMIN_EMAIL)).data?.user?.id,
          email: process.env.ADMIN_EMAIL,
          role: 'admin'
        }
      ]);
      
    if (profileError) {
      console.error('Error creating admin profile:', profileError);
    } else {
      console.log('Admin profile created/updated successfully');
    }
    
    // Add subscription for the admin
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .upsert([
        { 
          user_id: (await supabase.auth.admin.getUserById(process.env.ADMIN_EMAIL)).data?.user?.id,
          plan: 'enterprise',
          searches_remaining: 999999,
          active_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]);
      
    if (subscriptionError) {
      console.error('Error creating admin subscription:', subscriptionError);
    } else {
      console.log('Admin subscription created/updated successfully');
    }
    
  } catch (error) {
    console.error('Migration error:', error);
  }
}

runMigration();
