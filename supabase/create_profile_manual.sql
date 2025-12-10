-- =====================================================
-- Manual Profile Creation Script
-- =====================================================

-- STEP 1: Check if users exist in auth.users
SELECT 
    id,
    email,
    created_at,
    raw_user_meta_data->>'full_name' as full_name
FROM auth.users
ORDER BY created_at DESC;

-- STEP 2: Check if profiles exist
SELECT 
    id,
    email,
    full_name,
    role,
    created_at
FROM public.profiles
ORDER BY created_at DESC;

-- STEP 3: If profiles table is empty, create profiles for all existing users
-- This will automatically create profiles for users who don't have them yet
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', '') as full_name,
    'user' as role  -- default role
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL  -- only insert for users without profiles
ON CONFLICT (id) DO NOTHING;

-- STEP 4: Verify profiles were created
SELECT 
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
    COUNT(CASE WHEN role = 'user' THEN 1 END) as user_count
FROM public.profiles;

-- =====================================================
-- OPTIONAL: Manually create a specific user profile
-- =====================================================
-- Uncomment and modify the lines below if you need to create
-- a profile for a specific user manually

/*
INSERT INTO public.profiles (id, email, full_name, role)
VALUES (
    'YOUR-USER-ID-HERE',  -- Get this from auth.users table
    'your-email@example.com',
    'Your Full Name',
    'admin'  -- or 'user'
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = NOW();
*/

-- =====================================================
-- OPTIONAL: Set a specific user as admin
-- =====================================================
-- Uncomment and modify if you need to make a user an admin

/*
UPDATE public.profiles
SET role = 'admin', updated_at = NOW()
WHERE email = 'your-email@example.com';
*/
