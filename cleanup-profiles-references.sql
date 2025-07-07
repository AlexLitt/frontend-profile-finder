-- Database cleanup: Update any remaining references to 'profiles' table
-- Run this to ensure all database-level references use the new 'users' table

-- 1. Update any remaining triggers that reference 'profiles'
-- Check for triggers first
SELECT 'Current triggers that may reference profiles:' as info;
SELECT 
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE action_statement LIKE '%profiles%' OR event_object_table = 'profiles';

-- 2. If there are any triggers referencing 'profiles', they need to be updated
-- Example (adjust based on what triggers you find):
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- 
-- CREATE OR REPLACE FUNCTION public.handle_new_user()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   INSERT INTO public.users (id, email, role)
--   VALUES (new.id, new.email, 'user');
--   RETURN new;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;
--
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Update any RLS policies that might reference the old table
-- Check for policies that reference 'profiles' in their conditions
SELECT 'Policies that reference profiles table:' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    qual
FROM pg_policies 
WHERE qual LIKE '%profiles%';

-- 4. Verify all foreign keys point to 'users' table
SELECT 'Foreign keys should reference users table:' as info;
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
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND ccu.table_name = 'users';
