-- =====================================================
-- Verify User and Create Missing Profile
-- Run this if you still can't login after applying fix_auth_policies.sql
-- =====================================================

-- Step 1: Check if your user exists in auth.users
-- Replace 'your-email@example.com' with your actual email
DO $$
DECLARE
    user_email TEXT := 'your-email@example.com'; -- CHANGE THIS TO YOUR EMAIL
    user_record RECORD;
    profile_record RECORD;
BEGIN
    -- Find user
    SELECT * INTO user_record FROM auth.users WHERE email = user_email;
    
    IF user_record.id IS NULL THEN
        RAISE NOTICE '❌ User not found with email: %', user_email;
        RAISE NOTICE 'Please create an account first or check your email address.';
    ELSE
        RAISE NOTICE '✓ User found: % (ID: %)', user_email, user_record.id;
        
        -- Check if profile exists
        SELECT * INTO profile_record FROM public.profiles WHERE id = user_record.id;
        
        IF profile_record.id IS NULL THEN
            RAISE NOTICE '⚠ Profile missing for user. Creating now...';
            
            -- Create missing profile
            INSERT INTO public.profiles (id, email, full_name)
            VALUES (
                user_record.id,
                user_record.email,
                COALESCE(user_record.raw_user_meta_data->>'full_name', '')
            );
            
            RAISE NOTICE '✓ Profile created successfully!';
        ELSE
            RAISE NOTICE '✓ Profile exists for user';
            RAISE NOTICE '  - Email: %', profile_record.email;
            RAISE NOTICE '  - Full Name: %', COALESCE(profile_record.full_name, '(not set)');
            RAISE NOTICE '  - Role: %', profile_record.role;
        END IF;
    END IF;
END $$;

-- Step 2: List all RLS policies on profiles table
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles'
ORDER BY policyname;

-- Step 3: Check if trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
