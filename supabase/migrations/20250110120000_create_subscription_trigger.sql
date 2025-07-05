-- Add trigger to automatically create subscriptions when profiles are created
CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a default subscription for the new profile
  INSERT INTO public.subscriptions (user_id, plan, searches_remaining, active_until)
  VALUES (
    new.id, 
    CASE 
      WHEN new.role = 'admin' THEN 'enterprise'
      ELSE 'free'
    END,
    CASE 
      WHEN new.role = 'admin' THEN 999999
      ELSE 10
    END,
    CASE 
      WHEN new.role = 'admin' THEN '2030-12-31T23:59:59.000Z'::TIMESTAMPTZ
      ELSE (NOW() + INTERVAL '30 days')
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on profiles table
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_profile();

-- Also create INSERT policy for profiles to allow the signup process
CREATE POLICY "Allow profile creation during signup"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow subscription creation policy
CREATE POLICY "Allow subscription creation during signup"
  ON subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
