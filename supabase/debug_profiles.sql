-- =====================================================
-- DIAGNOSTIC: Check Why Profiles Are Not Created
-- =====================================================

-- CRITICAL: Run each step ONE BY ONE and check the results!

-- =====================================================
-- STEP 1: Check if ANY users exist in auth.users
-- =====================================================
SELECT 
    COUNT(*) as total_users,
    STRING_AGG(email, ', ') as user_emails
FROM auth.users;

-- EXPECTED: Should show at least 1 user if you created via Dashboard
-- IF THIS SHOWS 0: You need to create user via Dashboard first!

-- =====================================================
-- STEP 2: Show ALL user details from auth.users
-- =====================================================
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    confirmed_at,
    raw_user_meta_data,
    raw_app_meta_data
FROM auth.users
ORDER BY created_at DESC;

-- Check if there are any users listed here!

-- =====================================================
-- STEP 3: Check if profiles table exists and structure
-- =====================================================
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- EXPECTED: Should show: id, email, full_name, role, created_at, updated_at

-- =====================================================
-- STEP 4: Check if trigger exists and is enabled
-- =====================================================
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- EXPECTED: Should show the trigger exists

-- =====================================================
-- STEP 5: Check trigger function exists
-- =====================================================
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name = 'handle_new_user';

-- EXPECTED: Should show handle_new_user function

-- =====================================================
-- STEP 6: FORCE CREATE PROFILES FOR EXISTING USERS
-- =====================================================
-- This will create profiles for ALL existing users in auth.users
-- Run this AFTER checking Step 1 shows users exist!

DO $$
DECLARE
    user_record RECORD;
    profiles_created INTEGER := 0;
BEGIN
    -- Loop through all users without profiles
    FOR user_record IN 
        SELECT 
            au.id,
            au.email,
            COALESCE(au.raw_user_meta_data->>'full_name', '') as full_name
        FROM auth.users au
        LEFT JOIN public.profiles p ON au.id = p.id
        WHERE p.id IS NULL
    LOOP
        -- Insert profile for each user
        INSERT INTO public.profiles (id, email, full_name, role)
        VALUES (
            user_record.id,
            user_record.email,
            user_record.full_name,
            'admin'  -- First users are admins
        )
        ON CONFLICT (id) DO NOTHING;
        
        profiles_created := profiles_created + 1;
        RAISE NOTICE 'Created profile for: %', user_record.email;
    END LOOP;
    
    RAISE NOTICE '-----------------------------------';
    RAISE NOTICE 'Total profiles created: %', profiles_created;
    RAISE NOTICE '-----------------------------------';
END $$;

-- =====================================================
-- STEP 7: Verify profiles NOW exist
-- =====================================================
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.created_at,
    au.email as auth_email  -- Should match p.email
FROM public.profiles p
FULL OUTER JOIN auth.users au ON p.id = au.id
ORDER BY p.created_at DESC NULLS LAST;

-- EXPECTED: Should show at least 1 profile now!

-- =====================================================
-- STEP 8: Count summary
-- =====================================================
SELECT 
    (SELECT COUNT(*) FROM auth.users) as users_in_auth,
    (SELECT COUNT(*) FROM public.profiles) as profiles_created,
    CASE 
        WHEN (SELECT COUNT(*) FROM auth.users) = (SELECT COUNT(*) FROM public.profiles) 
        THEN '✓ MATCH - All users have profiles'
        ELSE '✗ MISMATCH - Some users missing profiles!'
    END as status;
