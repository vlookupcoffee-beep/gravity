-- CLEANUP OLD AUTH
-- WARNING: This deletes all existing users and profiles!

-- 1. Delete all users from auth.users (This cascades to many things usually, but we'll be thorough)
DELETE FROM auth.users;

-- 2. Drop the profiles table if it exists
DROP TABLE IF EXISTS profiles;

-- 3. Drop any triggers related to new user creation if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- SETUP NEW AUTH
-- 1. Create the login table
CREATE TABLE IF NOT EXISTS login (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL, -- Storing plain text as requested for initial simple setup. RECOMMENDED: Hash this!
    role TEXT NOT NULL CHECK (role IN ('owner', 'viewer')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Insert initial users
-- You can change the passwords here
INSERT INTO login (username, password, role)
VALUES 
    ('owner', '123456', 'owner'),
    ('viewer', '123456', 'viewer')
ON CONFLICT (username) DO NOTHING;

-- 3. Grant access to authenticated and service_role (just in case)
ALTER TABLE login ENABLE ROW LEVEL SECURITY;

-- Allow everything for service_role (which our app will use)
CREATE POLICY "Enable all for service_role" ON login
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Allow public read (optional, strictly speaking we should only access via server action with service key)
-- But effectively we are building a private app.
