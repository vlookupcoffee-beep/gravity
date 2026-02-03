-- Add project_type and total_distributions columns
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS project_type TEXT DEFAULT 'BACKBONE',
ADD COLUMN IF NOT EXISTS total_distributions INTEGER DEFAULT 1;

-- Update existing projects to be BACKBONE by default
UPDATE projects SET project_type = 'BACKBONE' WHERE project_type IS NULL;
UPDATE projects SET total_distributions = 1 WHERE total_distributions IS NULL;
