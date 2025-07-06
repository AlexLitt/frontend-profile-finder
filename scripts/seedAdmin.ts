// COPILOT FIX AUTH-SEED
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Create Supabase admin client
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function seedAdmin() {
  try {
    // Define the admin email - use environment variable if available
    const adminEmail = process.env.ADMIN_EMAIL || 'oleksii@example.com';
    
    // Check if user exists by listing users and filtering
    const { data: usersList, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      process.exit(1);
    }
    
    const existingUser = usersList.users.find(user => user.email === adminEmail);
    
    if (!existingUser) {
      // Create the user if they don't exist
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: process.env.ADMIN_INITIAL_PASSWORD || 'Password123!',
        email_confirm: true,
        user_metadata: { name: 'Admin User' }
      });
      
      if (createError) {
        console.error('Error creating admin user:', createError);
        process.exit(1);
      }
    }
    
    // Get the user ID (either existing or newly created)
    // We already have usersList from earlier, just reuse it
    const adminUser = usersList.users.find(user => user.email === adminEmail);
    
    if (!adminUser) {
      console.error('Could not find or create admin user');
      process.exit(1);
    }
    
    // Upsert the profile with admin role
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: adminUser.id,
        email: adminEmail,
        role: 'admin',
        full_name: 'Admin User',
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
      
    if (profileError) {
      console.error('Error updating admin profile:', profileError);
      process.exit(1);
    }
    
    // Create or update subscription
    const { error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .upsert({
        user_id: adminUser.id,
        plan: 'enterprise',
        searches_remaining: 999999,
        active_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
      
    if (subscriptionError) {
      console.error('Error setting up admin subscription:', subscriptionError);
      process.exit(1);
    }
    
    console.log('Admin user seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin user:', error);
    process.exit(1);
  }
}

seedAdmin();
