-- Create table for authorized Telegram users
CREATE TABLE IF NOT EXISTS telegram_authorized_users (
    telegram_id BIGINT PRIMARY KEY,
    name TEXT,
    is_active BOOLEAN DEFAULT true,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure is_admin column exists if table was created previously
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='telegram_authorized_users' AND column_name='is_admin') THEN
        ALTER TABLE telegram_authorized_users ADD COLUMN is_admin BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE telegram_authorized_users ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated users (for management via web)
DROP POLICY IF EXISTS "Allow read for authenticated users" ON telegram_authorized_users;
CREATE POLICY "Allow read for authenticated users" ON telegram_authorized_users
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow all for public (bot webhook access)
DROP POLICY IF EXISTS "Allow select for public" ON telegram_authorized_users;
CREATE POLICY "Allow all for public" ON telegram_authorized_users
    FOR ALL USING (true) WITH CHECK (true);

-- Junction table for User-Project mapping
CREATE TABLE IF NOT EXISTS telegram_user_projects (
    telegram_id BIGINT REFERENCES telegram_authorized_users(telegram_id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    PRIMARY KEY (telegram_id, project_id)
);

-- Enable RLS
ALTER TABLE telegram_user_projects ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated users (web management)
DROP POLICY IF EXISTS "Allow read for authenticated users" ON telegram_user_projects;
CREATE POLICY "Allow read for authenticated users" ON telegram_user_projects
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow all for public (bot access)
DROP POLICY IF EXISTS "Allow select for public" ON telegram_user_projects;
CREATE POLICY "Allow all for public" ON telegram_user_projects
    FOR ALL USING (true) WITH CHECK (true);

-- Insert initial admin/owner
INSERT INTO telegram_authorized_users (telegram_id, name, is_active, is_admin)
VALUES (81358099, 'Owner', true, true)
ON CONFLICT (telegram_id) DO UPDATE SET is_admin = true, is_active = true;
