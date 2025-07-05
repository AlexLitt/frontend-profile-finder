// Manual admin creation instructions

/*
Since we're having issues with the automated seed script, follow these steps to create
an admin account manually:

1. Start the development server:
   npm run dev

2. Navigate to http://localhost:5173/signup in your browser

3. Create an account with email: oleksii@example.com and password: SecurePassword123!

4. Once signed up, run the following SQL in your Supabase Dashboard SQL Editor:

   UPDATE profiles
   SET role = 'admin'
   WHERE email = 'oleksii@example.com';

5. Then, insert a subscription record:

   INSERT INTO subscriptions (user_id, plan, searches_remaining, active_until)
   VALUES (
     (SELECT id FROM profiles WHERE email = 'oleksii@example.com'),
     'enterprise',
     999999,
     NOW() + INTERVAL '365 days'
   )
   ON CONFLICT (user_id) 
   DO UPDATE SET
     plan = 'enterprise',
     searches_remaining = 999999,
     active_until = NOW() + INTERVAL '365 days',
     updated_at = NOW();

6. You should now be able to log in as an admin user!

*/

console.log("Please follow the manual admin creation instructions in the file.");
