-- =====================================================
-- SIMPLE CHECK - Copy dan Run di SQL EDITOR (bukan Table Editor!)
-- =====================================================

-- Query 1: Cek berapa user yang ada
SELECT COUNT(*) as total_users FROM auth.users;

-- Query 2: Lihat semua user yang ada
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users
ORDER BY created_at DESC;

-- =====================================================
-- JIKA Query 1 menunjukkan > 0 (ada user), 
-- tapi profiles masih kosong, jalankan ini:
-- =====================================================

INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', '') as full_name,
    'admin' as role
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Setelah itu cek lagi profiles table
SELECT * FROM public.profiles;
