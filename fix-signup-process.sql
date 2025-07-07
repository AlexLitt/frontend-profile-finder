-- 1. Ensure plans exist first
INSERT INTO public.plans (plan, searches_remaining)
VALUES 
    ('FREE', 10),
    ('PRO', 100),
    ('ENTERPRISE', 99999)
ON CONFLICT (plan) DO UPDATE
SET searches_remaining = EXCLUDED.searches_remaining;

-- 2. Create or replace the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    -- Create user record with free tier defaults
    INSERT INTO public.users (
        user_id,
        subscription_plan,
        searches_remaining,
        subscription_active_until,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        'FREE',
        10,  -- Free tier gets 10 searches
        NOW() + interval '30 days',
        NEW.created_at,
        NEW.created_at
    );

    -- Create user profile
    INSERT INTO public.user_profiles (
        id,
        email,
        full_name,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.created_at,
        NEW.created_at
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;

GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO service_role;

GRANT ALL ON public.plans TO authenticated;
GRANT ALL ON public.plans TO service_role;
