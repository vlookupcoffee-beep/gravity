-- DIAGNOSIS SCRIPT V3: Periksa Nilai Total & Jumlah Item
-- Project ID: 28e9e8a2-a3f2-4cdc-9583-8a6b8ae2c315

-- 1. Berapa Total Nilai Mandor yang terbaca di Database?
SELECT 
    COUNT(*) as "Total Rows",
    SUM(unit_price_mandor * quantity_mandor) as "Calculated Total Mandor",
    SUM(unit_price * quantity) as "Calculated Total Vendor"
FROM project_items
WHERE project_id = '28e9e8a2-a3f2-4cdc-9583-8a6b8ae2c315';

-- 2. Tampilkan 20 Item Mandor dengan Total Harga Tertinggi
-- (Cek apakah Qty atau Price-nya masuk akal)
SELECT 
    item_code, 
    description,
    unit_price_mandor as "Price Mandor",
    quantity_mandor as "Qty Mandor",
    (unit_price_mandor * quantity_mandor) as "Subtotal"
FROM project_items
WHERE project_id = '28e9e8a2-a3f2-4cdc-9583-8a6b8ae2c315'
AND quantity_mandor > 0
ORDER BY "Subtotal" DESC
LIMIT 20;

-- 3. Cek apakah ada item yang 'berceceran' (duplicate tapi tidak merge)
SELECT item_code, COUNT(*) as "Duplicate Count"
FROM project_items
WHERE project_id = '28e9e8a2-a3f2-4cdc-9583-8a6b8ae2c315'
GROUP BY item_code
HAVING COUNT(*) > 1;


