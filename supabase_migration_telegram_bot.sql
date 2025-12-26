-- Create Daily Reports Table
CREATE TABLE IF NOT EXISTS daily_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL, -- Can be null if project not found
  report_date DATE DEFAULT CURRENT_DATE,
  manpower_count INTEGER,
  executor_name TEXT,
  waspang_name TEXT,
  today_activity TEXT,
  tomorrow_plan TEXT,
  raw_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Daily Report Items Table (The parsed line items)
CREATE TABLE IF NOT EXISTS daily_report_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID REFERENCES daily_reports(id) ON DELETE CASCADE,
  material_id UUID REFERENCES materials(id) ON DELETE SET NULL,
  material_name_snapshot TEXT, -- Store name in case material_id is null/deleted
  quantity_scope NUMERIC DEFAULT 0, -- "Qty" in message
  quantity_total NUMERIC DEFAULT 0, -- "Done" in message
  quantity_today NUMERIC DEFAULT 0, -- "Today" in message
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_report_items ENABLE ROW LEVEL SECURITY;

-- Public Access Policies (Simplifying since Bot might be external/anon)
-- In production, you might want to restrict INSERT to only the specific Bot User ID or Secret
CREATE POLICY "Enable all for public" ON daily_reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for public" ON daily_report_items FOR ALL USING (true) WITH CHECK (true);
