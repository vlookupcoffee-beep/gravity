-- =====================================================
-- VERIFY USER DAN CREATE PROFILE
-- Jalankan di SQL Editor setelah membuat user via Dashboard
-- =====================================================

-- STEP 1: Cek user sudah ada
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC;

-- Jika ada user yang muncul, lanjut ke STEP 2

-- STEP 2: Create profile untuk user tersebut
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', 'Admin User') as full_name,
    'admin' as role
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- STEP 3: Verify profile sudah terbuat
SELECT 
    id,
    email,
    full_name,
    role,
    created_at
FROM public.profiles
ORDER BY created_at DESC;

-- STEP 4: Final Check - Hitung summary
SELECT 
    (SELECT COUNT(*) FROM auth.users) as total_users,
    (SELECT COUNT(*) FROM public.profiles) as total_profiles,
    (SELECT email FROM auth.users LIMIT 1) as email_for_login;

-- =====================================================
-- SETELAH INI SELESAI, ANDA BISA LOGIN!
-- =====================================================
-- Gunakan:
-- - Email: yang muncul di hasil STEP 4 (email_for_login)
-- - Password: yang Anda set saat membuat user di Dashboard
-- =====================================================
