-- 1. Fix project_material_requirements unique constraint
-- We need to handle NULLs in distribution_name if we want it to be unique.
-- A common trick in Postgres is to create a unique index that treats NULL as a value or use a default.
-- For simplicity, let's update existing records to have empty string instead of NULL if needed, 
-- but actually let's just create the correct index.

-- Drop old constraints if they exist
ALTER TABLE project_material_requirements DROP CONSTRAINT IF EXISTS project_material_requirements_project_id_material_id_key;
ALTER TABLE project_material_requirements DROP CONSTRAINT IF EXISTS project_material_requirements_project_id_material_id_dist_key;

-- Create a robust unique index that handles NULL distribution_name
-- In Postgres 15+, we can use NULLS NOT DISTINCT, but for compatibility let's use a COALESCE index or just ensure we send empty strings.
-- Let's use the standard approach:
CREATE UNIQUE INDEX IF NOT EXISTS idx_pmr_project_mat_dist ON project_material_requirements (project_id, material_id, (COALESCE(distribution_name, '')));

-- Alternatively, just use a standard unique constraint if we promise to use '' instead of NULL in code.
-- Let's go with the explicit constraint on 3 columns and update code to use '' for total.
ALTER TABLE project_material_requirements ADD CONSTRAINT project_material_requirements_project_id_material_id_dist_key UNIQUE(project_id, material_id, distribution_name);

-- 2. Ensure distribution_name has a default empty string to avoid NULL issues in unique constraints
ALTER TABLE project_material_requirements ALTER COLUMN distribution_name SET DEFAULT '';
UPDATE project_material_requirements SET distribution_name = '' WHERE distribution_name IS NULL;
ALTER TABLE project_material_requirements ALTER COLUMN distribution_name SET NOT NULL;

-- 3. Also update material_transactions for consistency (optional but good)
UPDATE material_transactions SET distribution_name = '' WHERE distribution_name IS NULL;
ALTER TABLE material_transactions ALTER COLUMN distribution_name SET DEFAULT '';
ALTER TABLE material_transactions ALTER COLUMN distribution_name SET NOT NULL;
