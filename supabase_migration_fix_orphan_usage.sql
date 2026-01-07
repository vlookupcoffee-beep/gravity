-- 1. AGGRESSIVE LINK FOR MATERIAL TRANSACTIONS
-- Link project_id if NULL based on notes
UPDATE material_transactions mt
SET project_id = p.id
FROM projects p
WHERE mt.project_id IS NULL 
  AND (
    mt.notes ILIKE '%' || p.name || '%' 
    OR p.name ILIKE '%' || mt.notes || '%'
    OR mt.notes ILIKE '%Auto-Report: %' || SPLIT_PART(p.name, ' (', 1) || '%'
  )
  AND mt.transaction_type = 'OUT';

-- Link material_id if NULL based on notes
UPDATE material_transactions mt
SET material_id = m.id
FROM materials m
WHERE mt.material_id IS NULL
  AND mt.notes ILIKE '%' || m.name || '%' -- More flexible match
  AND mt.transaction_type = 'OUT';

-- 2. LINK DAILY REPORTS & ITEMS (Just in case)
UPDATE daily_reports dr
SET project_id = p.id
FROM projects p
WHERE dr.project_id IS NULL
  AND (dr.today_activity ILIKE '%' || p.name || '%' OR dr.raw_message ILIKE '%' || p.name || '%');

UPDATE daily_report_items dri
SET material_id = m.id
FROM materials m
WHERE dri.material_id IS NULL
  AND (
    dri.material_name_snapshot ILIKE '%' || m.name || '%'
    OR m.name ILIKE '%' || dri.material_name_snapshot || '%'
  );

-- 3. ENSURE DISTRIBUTION IS NOT NULL (Empty string for default)
UPDATE material_transactions SET distribution_name = '' WHERE distribution_name IS NULL;
UPDATE project_material_requirements SET distribution_name = '' WHERE distribution_name IS NULL;

-- 4. DIAGNOSTIC: Check if any OUT transactions still have NULL material_id or project_id
-- If these return rows, we need to know why they didn't match.
SELECT 'TRANSACTIONS_MISSING_PROJECT' as label, count(*) FROM material_transactions WHERE project_id IS NULL AND transaction_type = 'OUT';
SELECT 'TRANSACTIONS_MISSING_MATERIAL' as label, count(*) FROM material_transactions WHERE material_id IS NULL AND transaction_type = 'OUT';
SELECT 'AVAILABLE_USAGE_FOR_PROJECT' as label, m.name, mt.quantity 
FROM material_transactions mt 
JOIN materials m ON mt.material_id = m.id 
WHERE mt.project_id = (SELECT id FROM projects WHERE name ILIKE '%SUKOREJO%' LIMIT 1)
  AND mt.transaction_type = 'OUT';
