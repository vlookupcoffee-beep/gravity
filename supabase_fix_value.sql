-- Ensure 'value' column exists and has correct type
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS value NUMERIC DEFAULT 0;

-- Enable RLS on projects if not already enabled (good practice)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to UPDATE projects
-- (Adjust logic if you need stricter control, e.g., only owner)
CREATE POLICY "Allow authenticated users to update projects"
ON projects FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Also ensure they can Select
CREATE POLICY "Allow authenticated users to select projects"
ON projects FOR SELECT
TO authenticated
USING (true);

-- Grant permissions just in case
GRANT ALL ON projects TO authenticated;
GRANT ALL ON projects TO service_role;
