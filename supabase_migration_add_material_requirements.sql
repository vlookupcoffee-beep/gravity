-- Create Project Material Requirements Table
CREATE TABLE IF NOT EXISTS project_material_requirements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
  quantity_needed NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, material_id)
);

-- Enable RLS
ALTER TABLE project_material_requirements ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read access for all users" ON project_material_requirements FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON project_material_requirements FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON project_material_requirements FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON project_material_requirements FOR DELETE USING (auth.role() = 'authenticated');
