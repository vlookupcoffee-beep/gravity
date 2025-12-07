-- Create KHS Providers Table (e.g., IDNET)
CREATE TABLE IF NOT EXISTS khs_providers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create KHS Items Table (The Price List)
CREATE TABLE IF NOT EXISTS khs_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES khs_providers(id) ON DELETE CASCADE,
  item_code TEXT NOT NULL, -- e.g., 'AC-ADSS-SM-12C'
  description TEXT,
  unit TEXT, -- e.g., 'meter', 'pcs'
  price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider_id, item_code)
);

-- Create Project Items Table (The BOQ / Bill of Quantities for a Project)
CREATE TABLE IF NOT EXISTS project_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  khs_item_id UUID REFERENCES khs_items(id),
  
  -- Snapshot of details in case KHS changes later, or for custom items
  item_code TEXT, 
  description TEXT,
  unit TEXT,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  
  quantity NUMERIC NOT NULL DEFAULT 0,
  progress NUMERIC NOT NULL DEFAULT 0, -- 0 to 100% completion for this specific item
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (simplified for now)
ALTER TABLE khs_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE khs_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON khs_providers FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON khs_providers FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON khs_providers FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON khs_items FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON khs_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON khs_items FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON project_items FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON project_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON project_items FOR UPDATE USING (true);
