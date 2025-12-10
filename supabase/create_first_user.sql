-- =====================================================
-- Check Existing Users and Create First User
-- =====================================================

-- STEP 1: Check if there are any users in auth.users
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC;

-- HASIL: Jika kosong (0 rows), berarti belum ada user sama sekali!
-- Anda perlu membuat user pertama melalui Supabase Dashboard

-- =====================================================
-- CARA 1: Membuat User Melalui Supabase Dashboard
-- =====================================================
-- 1. Buka Supabase Dashboard
-- 2. Klik "Authentication" di sidebar kiri
-- 3. Klik "Add User" atau "Users" > "Add User"
-- 4. Masukkan:
--    - Email: admin@gravity.com (atau email Anda)
--    - Password: password123 (ganti dengan password kuat)
--    - Auto Confirm User: YES (centang ini)
-- 5. Klik "Create User"
-- 6. Profile akan otomatis terbuat karena trigger sudah ada

-- =====================================================
-- CARA 2: Insert User Manual (ADVANCED - Tidak Disarankan)
-- =====================================================
-- CATATAN: Cara ini kompleks dan sebaiknya gunakan Cara 1 di atas
-- Hanya uncomment jika Anda paham cara hash password dengan bcrypt

/*
-- Anda perlu generate UUID dan hash password terlebih dahulu
-- Contoh password hash untuk 'password123' (INI HANYA CONTOH, JANGAN DIPAKAI!)
-- Hash password harus menggunakan bcrypt dengan cost 10

INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),  -- Generate random UUID
    'authenticated',
    'authenticated',
    'admin@gravity.com',  -- <-- Ganti dengan email Anda
    '$2a$10$HASH_PASSWORD_HERE',  -- <-- HARUS hash bcrypt yang valid!
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Admin User"}',  -- <-- Ganti nama jika perlu
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
);
*/

-- =====================================================
-- STEP 2: Setelah user dibuat, cek lagi auth.users
-- =====================================================
SELECT COUNT(*) as total_users FROM auth.users;

-- =====================================================
-- STEP 3: Buat profile untuk user baru (jika belum otomatis)
-- =====================================================
-- Run ini SETELAH user dibuat via Dashboard
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', 'Admin User') as full_name,
    'admin' as role  -- Buat user pertama sebagai admin
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STEP 4: Verify profile sudah terbuat
-- =====================================================
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.created_at
FROM public.profiles p
JOIN auth.users au ON p.id = au.id
ORDER BY p.created_at DESC;

-- Seharusnya sekarang ada 1 row dengan role 'admin'

-- =====================================================
-- STEP 5: Set user sebagai admin (jika perlu)
-- =====================================================
-- Uncomment dan ganti email jika perlu set role admin
/*
UPDATE public.profiles
SET role = 'admin', updated_at = NOW()
WHERE email = 'admin@gravity.com';
*/
