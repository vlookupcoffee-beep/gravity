-- Add description column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'description') THEN
        ALTER TABLE materials ADD COLUMN description TEXT;
    END IF;
END $$;

-- Insert or Update Materials from the provided list
INSERT INTO materials (name, description, unit, current_stock) VALUES
('AC-ADSS-SM-12C', 'Jasa Pemasangan Aerial Cable Fiber Optik Single Mode 12 Core', 'meter', 0),
('AC-ADSS-SM-24C', 'Jasa Pemasangan Aerial Cable Fiber Optik Single Mode 24 Core G.652 C Type ADSS Cable', 'meter', 0),
('AC-ADSS-SM-48C', 'Jasa Pemasangan Aerial Cable Fiber Optik Single Mode 48 Core G.652 C Type ADSS Cable', 'meter', 0),
('JC-OF-SM-48C', 'Jasa Pemasangan Joint Closure Untuk Fiber Optik Kapasitas 48', 'pcs', 0),
('PS-1-16-FAT', 'Jasa pemasangan Passive Splitter 1:16, type modular SC/UPC, for FAT, termasuk pigtail', 'pcs', 0),
('FAT-PB-16C-SOLID', 'Jasa pemasangan FAT type POLE Kap 16 core adaptor SC/UPC terdiri dari 2Box Spliter (termasuk 2 spliter 1:8), 1Box beserta Accessories, berikut pelabelan.', 'pcs', 0),
('FDT-STDG-144C', 'Jasa pemasangan Kabinet FDT(Outdoor) With Space For Passive Splitter, Adaptor SC Kapasitas 144 Core, Berikut Pelabelan', 'pcs', 0),
('FDT-STDG-288C', 'Jasa pemasangan Kabinet FDT(Outdoor) With Space For Passive Splitter, Adaptor SC Kapasitas 288 Core, Berikut Pelabelan', 'pcs', 0),
('NP-7.0-140-2S', 'Jasa pemasangan New Pole 7 Meter 600 x 3", 200 x 3" x 100 x 2,5", Berikut Cat dengan warna identitas Kuning (atas) Biru (bawah)', 'pcs', 0),
('NP-7.0-140-3S', 'Jasa pemasangan New Pole 7 Meter 300 x 4", 200 x 3" x 200 x 2,5", Berikut Cat dengan warna identitas Kuning (atas) Biru (bawah) & Cor Pondasi dengan Kekuatan Tarik 140 Kg', 'pcs', 0),
('SLACK-SUPPORT-80', 'Jasa Pemasangan Slack include sabuk ukuran dimensi dalam (P x L = 80cm x 80cm)', 'pcs', 0),
('RP-GALVANIS', 'Jasa Pemasangan Riser Pipe Untuk Pengamanan Kabel Optik Ke FDT Pole / Titik Naik Ku Diameter 2 Inch Panjang 3 Meter', 'pcs', 0),
('ACC-STAINLESS BELT', 'Jasa Pemasangan Aksesoris Tiang Besi Stainless Belt dan', 'pcs', 0),
('ACC-HELLICAL', 'Jasa Pemasangan Aksesoris Tiang Besi Helycal Cable', 'pcs', 0),
('ACC-Bracket', 'Jasa Pemasangan Aksesoris Tiang Besi Anchoring/ Bracket A', 'pcs', 0)
ON CONFLICT (name) DO UPDATE 
SET description = EXCLUDED.description,
    unit = EXCLUDED.unit;
