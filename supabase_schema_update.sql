-- Add new columns to the 'projects' table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS status text DEFAULT 'planning', -- planning, in-progress, completed, on-hold
ADD COLUMN IF NOT EXISTS value numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS start_date date,
ADD COLUMN IF NOT EXISTS end_date date,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS progress integer DEFAULT 0;

-- Create the 'project_files' table
CREATE TABLE IF NOT EXISTS project_files (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL,
  type text,
  size numeric,
  created_at timestamptz DEFAULT now()
);

-- (Optional) Create a constraint for status values to ensure data integrity
ALTER TABLE projects 
ADD CONSTRAINT check_status 
CHECK (status IN ('planning', 'in-progress', 'completed', 'on-hold'));
