-- Debug script to check material transactions for DEPLOYMENT FDT-KRJO-YSWN project

-- 1. Find project ID
SELECT id, name FROM projects WHERE name ILIKE '%YOSOWINANGUN%' OR name ILIKE '%KRJO-YSWN%';

-- 2. Check approved reports (replace PROJECT_ID with actual ID from step 1)
-- Example: SELECT * FROM daily_reports WHERE project_id = 'xxx' AND status = 'APPROVED' ORDER BY created_at DESC LIMIT 5;

-- 3. Check material transactions (replace PROJECT_ID)  
-- Example: SELECT mt.*, m.name as material_name FROM material_transactions mt JOIN materials m ON mt.material_id = m.id WHERE mt.project_id = 'xxx' AND mt.transaction_type = 'OUT' ORDER BY mt.created_at DESC LIMIT 10;

-- 4. Check distribution names in transactions
-- Example: SELECT DISTINCT distribution_name FROM material_transactions WHERE project_id = 'xxx';

-- 5. Check material requirements
-- Example: SELECT pmr.*, m.name as material_name FROM project_material_requirements pmr JOIN materials m ON pmr.material_id = m.id WHERE pmr.project_id = 'xxx';
