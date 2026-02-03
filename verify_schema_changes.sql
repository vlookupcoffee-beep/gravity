-- Verify Schema Changes - Tahap 1
-- Check apakah kolom baru sudah ada di materials

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'materials'
AND column_name IN ('unit_price_vendor', 'unit_price_mandor', 'khs_item_code', 'category')
ORDER BY column_name;

-- Check kolom baru di project_material_requirements
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'project_material_requirements'
AND column_name IN ('unit_price_vendor', 'unit_price_mandor', 'item_code', 'description', 'total_value_vendor', 'total_value_mandor')
ORDER BY column_name;

-- Check apakah tabel mandor_prices sudah ada
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'mandor_prices'
) as mandor_prices_exists;
