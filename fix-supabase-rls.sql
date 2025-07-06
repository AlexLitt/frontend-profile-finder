-- Fix user deletion issues
-- This migration adds proper deletion policies and cascade deletes

-- First, clean up any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can delete their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can delete any profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete their own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Admins can delete any subscription" ON subscriptions;

-- 1. Add DELETE policy for profiles (users can delete their own profile)
CREATE POLICY "Users can delete their own profile"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- 2. Add DELETE policy for admins to delete any profile
CREATE POLICY "Admins can delete any profile"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ));

-- 3. Add DELETE policy for subscriptions (users can delete their own)
CREATE POLICY "Users can delete their own subscription"
  ON subscriptions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. Add DELETE policy for admins to delete any subscription
CREATE POLICY "Admins can delete any subscription"
  ON subscriptions
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ));

-- 5. Clean up existing trigger and function (in correct order)
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
DROP FUNCTION IF EXISTS public.handle_user_deletion();

-- 6. Create a function to handle user deletion (cascade delete related records)
CREATE OR REPLACE FUNCTION public.handle_user_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete subscriptions first (they reference profiles)
  DELETE FROM public.subscriptions WHERE user_id = OLD.id;
  
  -- Delete profile
  DELETE FROM public.profiles WHERE id = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create trigger for user deletion
CREATE TRIGGER on_auth_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_user_deletion();

-- 8. Grant table-level permissions
GRANT DELETE ON profiles TO authenticated;
GRANT DELETE ON subscriptions TO authenticated;

-- Debug: Check current policies and constraints
-- Run these queries to see what's blocking deletion:

-- 1. Check all policies on profiles table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';

-- 2. Check all policies on subscriptions table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'subscriptions';

-- 3. Check foreign key constraints
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name,
    rc.delete_rule
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    LEFT JOIN information_schema.referential_constraints AS rc
      ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND (tc.table_name = 'profiles' OR tc.table_name = 'subscriptions');

-- 4. Alternative: Use service role to bypass RLS for deletion
-- If the above doesn't work, you might need to delete using service role
-- This is a last resort - normally RLS should allow deletion with proper policies

-- 5. Check if the deletion trigger exists
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_deleted';
