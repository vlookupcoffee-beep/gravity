-- FIX RLS: Make policies permissive (Public Access)
-- This is necessary if the custom login system is not setting Supabase auth context correctly.

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON project_material_requirements;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON project_material_requirements;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON project_material_requirements;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON project_material_requirements;

-- Ensure RLS is enabled
ALTER TABLE project_material_requirements ENABLE ROW LEVEL SECURITY;

-- Create Permissive Policies (Allow All)
CREATE POLICY "Enable read public" ON project_material_requirements FOR SELECT USING (true);
CREATE POLICY "Enable insert public" ON project_material_requirements FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update public" ON project_material_requirements FOR UPDATE USING (true);
CREATE POLICY "Enable delete public" ON project_material_requirements FOR DELETE USING (true);
