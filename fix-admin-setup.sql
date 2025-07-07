-- Check and fix admin user setup
-- Run this in your Supabase SQL Editor

-- 1. Check what exists in auth.users
SELECT 'auth.users table:' as check_type;
SELECT id, email, created_at, email_confirmed_at
FROM auth.users 
WHERE email = 'morningbrew23@gmail.com';

-- 2. Check if users table exists and what's in it
SELECT 'users table:' as check_type;
SELECT id, email, role, subscription_plan, searches_remaining, subscription_active_until
FROM users 
WHERE email = 'morningbrew23@gmail.com';

-- 3. If the admin user doesn't exist in users table, insert it
-- (This will only run if the user doesn't exist)
INSERT INTO users (
    id, 
    email, 
    name,
    role, 
    subscription_plan, 
    searches_remaining, 
    subscription_active_until,
    created_at,
    updated_at
)
SELECT 
    au.id,
    au.email,
    'Admin User',
    'admin'::user_role,
    'enterprise',
    99999,
    NOW() + INTERVAL '365 days',
    au.created_at,
    NOW()
FROM auth.users au
WHERE au.email = 'morningbrew23@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = au.id
  );

-- 4. Update existing admin user to ensure correct settings
UPDATE users SET
    role = 'admin'::user_role,
    subscription_plan = 'enterprise',
    searches_remaining = 99999,
    subscription_active_until = NOW() + INTERVAL '365 days',
    updated_at = NOW()
WHERE email = 'morningbrew23@gmail.com';

-- 5. Final verification
SELECT 'Final result:' as check_type;
SELECT 
    u.id,
    u.email,
    u.name,
    u.role,
    u.subscription_plan,
    u.searches_remaining,
    u.subscription_active_until,
    'Matches auth.users: ' || CASE WHEN au.id IS NOT NULL THEN 'YES' ELSE 'NO' END as auth_match
FROM users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.email = 'morningbrew23@gmail.com';
