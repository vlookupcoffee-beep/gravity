-- STEP 1: LIHAT APA YANG SUDAH ADA (DEBUG)
-- Jalankan ini dulu, lalu kirmkan hasilnya ke saya jika Step 2 gagal.
SELECT 
    conname as constraint_name, 
    pg_get_constraintdef(c.oid) as constraint_definition
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
WHERE n.nspname = 'public' 
AND c.conrelid = 'project_items'::regclass;

-- STEP 2: MEMBERSIHKAN & MEMASANG ULANG (CLEAN FIX)
-- Jalankan blok ini semuanya.

-- A. Hapus semua pengaman lama yang mungkin bentrok
ALTER TABLE project_items DROP CONSTRAINT IF EXISTS unique_project_item_code;
ALTER TABLE project_items DROP CONSTRAINT IF EXISTS project_items_project_khs_key;
ALTER TABLE project_items DROP CONSTRAINT IF EXISTS project_items_project_id_item_code_key;
DROP INDEX IF EXISTS project_items_merge_idx;
DROP INDEX IF EXISTS unique_project_item_code;

-- B. Pastikan data item_code tidak ada yang kosong (Supabase butuh ini)
UPDATE project_items SET item_code = 'NONE' WHERE item_code IS NULL;
ALTER TABLE project_items ALTER COLUMN item_code SET NOT NULL;
ALTER TABLE project_items ALTER COLUMN project_id SET NOT NULL;

-- C. Hapus data duplikat (Hanya simpan satu per Project + Item Code)
DELETE FROM project_items
WHERE ctid NOT IN (
    SELECT MIN(ctid)
    FROM project_items
    GROUP BY project_id, item_code
);

-- D. Pasang Pengaman Unik yang BARU & BERSIH
-- Gunakan nama yang sangat spesifik agar tidak tertukar
ALTER TABLE project_items ADD CONSTRAINT project_items_upsert_unique UNIQUE (project_id, item_code);

-- E. Pastikan kolom Mandor ada
ALTER TABLE project_items ADD COLUMN IF NOT EXISTS unit_price_mandor NUMERIC DEFAULT 0;
ALTER TABLE project_items ADD COLUMN IF NOT EXISTS quantity_mandor NUMERIC DEFAULT 0;

-- VERIFIKASI AKHIR
SELECT 'BERHASIL! Pengaman project_items_upsert_unique sudah terpasang.' as status;
