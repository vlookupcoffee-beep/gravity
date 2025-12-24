-- Create Materials Table
CREATE TABLE IF NOT EXISTS materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  unit TEXT NOT NULL,
  current_stock NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Material Transactions Table
CREATE TABLE IF NOT EXISTS material_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('IN', 'OUT')),
  quantity NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID DEFAULT auth.uid()
);

-- Enable RLS
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for materials
CREATE POLICY "Enable read access for all users" ON materials FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON materials FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON materials FOR UPDATE USING (auth.role() = 'authenticated');

-- Policies for material_transactions
CREATE POLICY "Enable read access for all users" ON material_transactions FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON material_transactions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
