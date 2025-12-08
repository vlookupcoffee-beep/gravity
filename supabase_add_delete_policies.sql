-- Add DELETE policies for KHS tables
-- This allows deleting KHS items and providers

-- Add DELETE policy for khs_providers
CREATE POLICY "Enable delete for all users" ON khs_providers FOR DELETE USING (true);

-- Add DELETE policy for khs_items
CREATE POLICY "Enable delete for all users" ON khs_items FOR DELETE USING (true);

-- Add DELETE policy for project_items
CREATE POLICY "Enable delete for all users" ON project_items FOR DELETE USING (true);
