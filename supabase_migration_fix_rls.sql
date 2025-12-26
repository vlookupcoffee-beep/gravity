-- Re-apply policies for project_material_requirements

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON project_material_requirements;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON project_material_requirements;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON project_material_requirements;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON project_material_requirements;

-- Ensure RLS is enabled
ALTER TABLE project_material_requirements ENABLE ROW LEVEL SECURITY;

-- Re-create Policies
CREATE POLICY "Enable read access for all users" ON project_material_requirements FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON project_material_requirements FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON project_material_requirements FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON project_material_requirements FOR DELETE USING (auth.role() = 'authenticated');
