-- Add distribution_name to project_material_requirements
ALTER TABLE project_material_requirements ADD COLUMN IF NOT EXISTS distribution_name TEXT;

-- Add distribution_name to material_transactions
ALTER TABLE material_transactions ADD COLUMN IF NOT EXISTS distribution_name TEXT;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_pmr_distribution ON project_material_requirements(project_id, distribution_name);
CREATE INDEX IF NOT EXISTS idx_mt_distribution ON material_transactions(project_id, distribution_name);
