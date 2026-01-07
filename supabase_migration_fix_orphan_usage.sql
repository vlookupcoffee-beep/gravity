-- 1. Link orphan transactions to PROJECTS if project_id is NULL
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

-- 2. Link orphan transactions to MATERIALS if material_id is NULL
-- Note format: "Telegram Auto-Report: Site Name (Date) - MaterialName"
UPDATE material_transactions mt
SET material_id = m.id
FROM materials m
WHERE mt.material_id IS NULL
  AND mt.notes LIKE '% - ' || m.name || '%'
  AND mt.transaction_type = 'OUT';

-- 3. Fix project_id in daily_reports if missing
UPDATE daily_reports dr
SET project_id = p.id
FROM projects p
WHERE dr.project_id IS NULL
  AND (dr.today_activity ILIKE '%' || p.name || '%' OR dr.raw_message ILIKE '%' || p.name || '%');

-- 4. Fix material_id in daily_report_items if missing
UPDATE daily_report_items dri
SET material_id = m.id
FROM materials m
WHERE dri.material_id IS NULL
  AND dri.material_name_snapshot ILIKE '%' || m.name || '%';

-- 5. Fix distribution column for consistency
UPDATE material_transactions SET distribution_name = '' WHERE distribution_name IS NULL;
UPDATE project_material_requirements SET distribution_name = '' WHERE distribution_name IS NULL;

-- 3. Diagnostic Query (Run this in Supabase SQL Editor to see current status)
/*
SELECT 
    m.name, 
    mt.transaction_type, 
    mt.quantity, 
    mt.project_id, 
    mt.distribution_name,
    mt.notes
FROM material_transactions mt
JOIN materials m ON mt.material_id = m.id
WHERE mt.project_id = 'PROJECT_ID_HERE' -- Replace with your project ID
*/
