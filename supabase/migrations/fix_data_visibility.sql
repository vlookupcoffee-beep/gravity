-- FIX DATA VISIBILITY
-- Since we switched to custom auth and application-level security, 
-- we need to allow the database to return data to our application client.

-- 1. Projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for projects" ON projects;
CREATE POLICY "Allow all for projects" ON projects FOR ALL USING (true) WITH CHECK (true);

-- 2. PoW Tasks
ALTER TABLE pow_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for pow_tasks" ON pow_tasks;
CREATE POLICY "Allow all for pow_tasks" ON pow_tasks FOR ALL USING (true) WITH CHECK (true);

-- 3. Structures
ALTER TABLE structures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for structures" ON structures;
CREATE POLICY "Allow all for structures" ON structures FOR ALL USING (true) WITH CHECK (true);

-- 4. Routes
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for routes" ON routes;
CREATE POLICY "Allow all for routes" ON routes FOR ALL USING (true) WITH CHECK (true);

-- 5. RAB Items
ALTER TABLE rab_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for rab_items" ON rab_items;
CREATE POLICY "Allow all for rab_items" ON rab_items FOR ALL USING (true) WITH CHECK (true);
