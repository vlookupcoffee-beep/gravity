-- =====================================================
-- Create Manual Users: Owner & Viewer
-- =====================================================

-- INSTRUCTIONS:
-- 1. Run this script in Supabase SQL Editor AFTER running auth_setup.sql
-- 2. Update the email addresses and passwords below
-- 3. Users will be created with their profiles automatically

-- =====================================================
-- Create Owner User (Full Access)
-- =====================================================

-- Option 1: Create via SQL (requires admin privileges)
-- Note: This uses Supabase's internal auth functions
-- You can also create users via Supabase Dashboard → Authentication → Users → Add User

-- Example Owner User:
-- Email: owner@example.com
-- Password: Set via Supabase Dashboard
-- Role: owner

-- To create manually via Supabase Dashboard:
-- 1. Go to Authentication → Users
-- 2. Click "Add User" → "Create New User"
-- 3. Email: your_owner_email@example.com
-- 4. Password: [set secure password]
-- 5. Auto Confirm User: YES
-- 6. Click "Create User"
-- 7. The profile will be auto-created via trigger

-- After user is created, update their role to 'owner':
-- UPDATE profiles SET role = 'owner' WHERE email = 'your_owner_email@example.com';

-- =====================================================
-- Create Viewer User (Read-Only Access)
-- =====================================================

-- Example Viewer User:
-- Email: viewer@example.com  
-- Password: Set via Supabase Dashboard
-- Role: viewer

-- To create manually via Supabase Dashboard:
-- 1. Go to Authentication → Users
-- 2. Click "Add User" → "Create New User"
-- 3. Email: your_viewer_email@example.com
-- 4. Password: [set secure password]
-- 5. Auto Confirm User: YES
-- 6. Click "Create User"
-- 7. The profile will be auto-created via trigger

-- After user is created, update their role to 'viewer':
-- UPDATE profiles SET role = 'viewer' WHERE email = 'your_viewer_email@example.com';

-- =====================================================
-- Update Role-Based Permissions (Optional)
-- =====================================================

-- If you want viewers to have read-only access, update RLS policies:

-- Example: Only 'owner' can create/update/delete projects
-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can update projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can delete projects" ON public.projects;

-- New policies with role check
CREATE POLICY "Only owner can create projects"
    ON public.projects FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'owner'
        )
    );

CREATE POLICY "Only owner can update projects"
    ON public.projects FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'owner'
        )
    );

CREATE POLICY "Only owner can delete projects"
    ON public.projects FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'owner'
        )
    );

-- Apply same pattern to other tables (project_items, pow_tasks, etc.)
-- For brevity, showing just one example above

-- =====================================================
-- Verify Users
-- =====================================================

-- Check created users:
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.created_at
FROM profiles p
ORDER BY p.created_at DESC;

-- =====================================================
-- SUMMARY OF STEPS
-- =====================================================

-- ✅ Step 1: Create Owner User via Supabase Dashboard
--    - Email: [your-choice]
--    - Password: [secure-password]
--    - Auto-confirm: YES

-- ✅ Step 2: Update Owner Role
--    UPDATE profiles SET role = 'owner' WHERE email = '[your-owner-email]';

-- ✅ Step 3: Create Viewer User via Supabase Dashboard  
--    - Email: [your-choice]
--    - Password: [secure-password]
--    - Auto-confirm: YES

-- ✅ Step 4: Update Viewer Role
--    UPDATE profiles SET role = 'viewer' WHERE email = '[your-viewer-email]';

-- ✅ Step 5: (Optional) Run role-based permission policies above
--    to restrict viewer to read-only access

RAISE NOTICE 'Instructions displayed above. Create users via Supabase Dashboard.';
