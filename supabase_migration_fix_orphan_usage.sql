-- 1. CLEANUP & PREP
UPDATE material_transactions SET distribution_name = '' WHERE distribution_name IS NULL;
UPDATE project_material_requirements SET distribution_name = '' WHERE distribution_name IS NULL;

-- 2. LINK ORPHAN REPORTS & ITEMS
-- Ensure project_id is linked in daily_reports
UPDATE daily_reports dr
SET project_id = p.id
FROM projects p
WHERE dr.project_id IS NULL
  AND (dr.today_activity ILIKE '%' || p.name || '%' OR dr.raw_message ILIKE '%' || p.name || '%');

-- Ensure material_id is linked in daily_report_items
UPDATE daily_report_items dri
SET material_id = m.id
FROM materials m
WHERE dri.material_id IS NULL
  AND (
    dri.material_name_snapshot ILIKE '%' || m.name || '%'
    OR m.name ILIKE '%' || dri.material_name_snapshot || '%'
  );

-- 3. REGENERATE MISSING TRANSACTIONS
-- Create OUT transactions for report items that don't have one yet.
-- We use a CTE to find missing links by matching Material, Project, and Quantity.
INSERT INTO material_transactions (material_id, project_id, transaction_type, quantity, notes, created_at, distribution_name)
SELECT 
    dri.material_id, 
    dr.project_id, 
    'OUT', 
    dri.quantity_today, 
    'Auto-Sync from Daily Report: ' || COALESCE(dr.executor_name, 'Unknown') || ' - ' || dri.material_name_snapshot, 
    dr.report_date,
    ''
FROM daily_report_items dri
JOIN daily_reports dr ON dri.report_id = dr.id
WHERE dri.material_id IS NOT NULL 
  AND dri.quantity_today > 0
  AND dr.project_id IS NOT NULL
  AND NOT EXISTS (
    -- Prevent duplicate if transaction already exists for this material/project/qty on same day
    SELECT 1 FROM material_transactions mt
    WHERE mt.material_id = dri.material_id
      AND mt.project_id = dr.project_id
      AND mt.quantity = dri.quantity_today
      AND mt.transaction_type = 'OUT'
      AND mt.created_at::date = dr.report_date::date
  );

-- 4. DIAGNOSTIC RESULTS
SELECT 'ITEMS_LINKED' as label, count(*) FROM daily_report_items WHERE material_id IS NOT NULL;
SELECT 'PROJECTS_LINKED' as label, count(*) FROM daily_reports WHERE project_id IS NOT NULL;
SELECT 'USAGE_RECORDS_TOTAL' as label, count(*) FROM material_transactions WHERE transaction_type = 'OUT';
SELECT 'USAGE_FOR_TARGET_PROJECT' as label, count(*) FROM material_transactions 
WHERE project_id = (SELECT id FROM projects WHERE name ILIKE '%SUKOREJO%' LIMIT 1)
  AND transaction_type = 'OUT';
