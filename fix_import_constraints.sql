-- SAFETY FIX V10: ID DEFAULT & CLEANUP
-- Jalankan ini di Supabase SQL Editor (PRODUCTION) jika Mandor masih error.

-- 1. Pastikan DEFAULT gen_random_uuid terpasang pada kolom ID
-- Ini mencegah error "null value in column id" saat insert baru
ALTER TABLE project_items ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 2. Pastikan kolom id tidak menerima NULL
ALTER TABLE project_items ALTER COLUMN id SET NOT NULL;

-- 3. Verifikasi Default Value
SELECT column_name, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'project_items' AND column_name = 'id';

-- VERIFIKASI AKHIR
SELECT 'BERHASIL! Default ID sudah dipastikan terpasang.' as status;
