// COPILOT FIX AUTH-SEED
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const adminEmail = process.env.ADMIN_EMAIL || 'oleksii@example.com';
const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'Password123!';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Create Supabase admin client
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function seedAdmin() {
  try {
    console.log(`Creating/updating admin user: ${adminEmail}`);
    
    // Create the user - this will either create a new user or update an existing one
    const { data: user, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { name: 'Admin User' }
    });
    
    if (createError) {
      console.error('Error creating/updating admin user:', createError);
      process.exit(1);
    }
    
    console.log('Admin user created or updated successfully:', user?.user?.email);
    
    // Upsert the profile with admin role
    console.log('Updating user profile with admin role');
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: user.user.id,
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
    console.log('Setting up admin subscription');
    const { error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .upsert({
        user_id: user.user.id,
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
    console.log('----------------------------------');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('Role: admin');
    console.log('----------------------------------');
    console.log('You can now log in with these credentials.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin user:', error);
    process.exit(1);
  }
}

seedAdmin();
