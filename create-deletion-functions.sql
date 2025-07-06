-- Create a function to safely delete a user account and associated data
-- This function can be called via RPC and handles the cascade deletion properly

CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS json
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    current_user_id uuid;
    result json;
BEGIN
    -- Get the current authenticated user
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'No authenticated user');
    END IF;
    
    -- Delete the user profile (this should cascade to other related data)
    DELETE FROM user_profiles WHERE user_id = current_user_id;
    
    -- Delete the auth user (this requires proper permissions)
    -- Note: This might fail if we don't have the right permissions
    BEGIN
        -- In production, this would typically be done via a service role or webhook
        -- For now, we'll just delete the profile and let the trigger handle auth deletion
        RETURN json_build_object(
            'success', true, 
            'message', 'Profile deleted successfully. Auth user deletion requires admin privileges.',
            'user_id', current_user_id
        );
    EXCEPTION WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Error during deletion: ' || SQLERRM,
            'user_id', current_user_id
        );
    END;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_account() TO authenticated;

-- Create a more comprehensive deletion function that can be called by admins
CREATE OR REPLACE FUNCTION admin_delete_user(target_user_id uuid)
RETURNS json
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    current_user_role text;
    result json;
BEGIN
    -- Check if current user is admin
    SELECT role INTO current_user_role 
    FROM user_profiles 
    WHERE user_id = auth.uid();
    
    IF current_user_role != 'admin' THEN
        RETURN json_build_object('success', false, 'error', 'Admin privileges required');
    END IF;
    
    -- Delete the user profile and related data
    DELETE FROM user_profiles WHERE user_id = target_user_id;
    
    RETURN json_build_object(
        'success', true, 
        'message', 'User deleted successfully',
        'deleted_user_id', target_user_id
    );
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false, 
        'error', 'Error during deletion: ' || SQLERRM,
        'target_user_id', target_user_id
    );
END;
$$;

-- Grant execute permission to authenticated users (function will check admin role internally)
GRANT EXECUTE ON FUNCTION admin_delete_user(uuid) TO authenticated;

-- Create a function to check current RLS policies
CREATE OR REPLACE FUNCTION check_rls_policies()
RETURNS json
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    policies_info json;
BEGIN
    SELECT json_agg(
        json_build_object(
            'table_name', schemaname || '.' || tablename,
            'policy_name', policyname,
            'permissive', permissive,
            'roles', roles,
            'cmd', cmd,
            'qual', qual,
            'with_check', with_check
        )
    ) INTO policies_info
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_profiles';
    
    RETURN COALESCE(policies_info, '[]'::json);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION check_rls_policies() TO authenticated;

-- Check if triggers exist
CREATE OR REPLACE FUNCTION check_triggers()
RETURNS json
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    triggers_info json;
BEGIN
    SELECT json_agg(
        json_build_object(
            'trigger_name', trigger_name,
            'event_manipulation', event_manipulation,
            'event_object_table', event_object_table,
            'action_statement', action_statement
        )
    ) INTO triggers_info
    FROM information_schema.triggers
    WHERE event_object_schema = 'public' 
    AND event_object_table IN ('user_profiles')
    OR trigger_name LIKE '%user%';
    
    RETURN COALESCE(triggers_info, '[]'::json);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION check_triggers() TO authenticated;
