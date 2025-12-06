-- Ubah tipe data coordinates dan path menjadi JSONB
-- Jalankan di Supabase SQL Editor

-- 1. Hapus kolom lama
ALTER TABLE structures DROP COLUMN IF EXISTS coordinates;
ALTER TABLE routes DROP COLUMN IF EXISTS path;

-- 2. Tambah kolom baru dengan tipe JSONB
ALTER TABLE structures ADD COLUMN coordinates JSONB;
ALTER TABLE routes ADD COLUMN path JSONB;

-- 3. Buat index untuk performa
CREATE INDEX IF NOT EXISTS idx_structures_coordinates ON structures USING GIN (coordinates);
CREATE INDEX IF NOT EXISTS idx_routes_path ON routes USING GIN (path);
