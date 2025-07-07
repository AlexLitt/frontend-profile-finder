-- Database Schema Verification
-- Check current state and ensure everything is properly set up

-- 1. Verify users table structure
SELECT 'users table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 2. Check RLS policies on users table
SELECT 'users table policies:' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'users';

-- 3. Verify foreign key relationships are working
SELECT 'Foreign key constraints:' as info;
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND (tc.table_name IN ('users', 'user_profiles', 'saved_searches', 'user_preferences'));

-- 4. Check if any triggers need updating
SELECT 'Triggers:' as info;
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table IN ('users', 'profiles');

-- 5. Verify admin user is properly set up
SELECT 'Admin user verification:' as info;
SELECT 
    id,
    email,
    role,
    subscription_plan,
    searches_remaining,
    subscription_active_until
FROM users 
WHERE email = 'morningbrew23@gmail.com';
