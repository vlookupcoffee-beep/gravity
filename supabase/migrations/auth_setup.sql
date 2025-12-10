-- =====================================================
-- Authentication Setup - User Profiles & RLS Policies
-- =====================================================

-- 1. Create profiles table for extended user information
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies for profiles table
-- Drop existing policies if any
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Allow everyone to view profiles (read-only access to profile info)
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles
    FOR SELECT
    USING (true);

-- Users can only insert their own profile
CREATE POLICY "Users can insert own profile"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- 4. Create function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Update timestamp on profile changes
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_updated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- Update RLS Policies for Existing Tables
-- =====================================================

-- PROJECTS TABLE
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Authenticated users can view projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can update projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can delete projects" ON public.projects;

-- Create new policies requiring authentication
CREATE POLICY "Authenticated users can view projects"
    ON public.projects FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can create projects"
    ON public.projects FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update projects"
    ON public.projects FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can delete projects"
    ON public.projects FOR DELETE
    TO authenticated
    USING (true);

-- PROJECT_ITEMS TABLE
ALTER TABLE public.project_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view project_items" ON public.project_items;
DROP POLICY IF EXISTS "Authenticated users can create project_items" ON public.project_items;
DROP POLICY IF EXISTS "Authenticated users can update project_items" ON public.project_items;
DROP POLICY IF EXISTS "Authenticated users can delete project_items" ON public.project_items;

CREATE POLICY "Authenticated users can view project_items"
    ON public.project_items FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can create project_items"
    ON public.project_items FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update project_items"
    ON public.project_items FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can delete project_items"
    ON public.project_items FOR DELETE
    TO authenticated
    USING (true);

-- POW_TASKS TABLE
ALTER TABLE public.pow_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view pow_tasks" ON public.pow_tasks;
DROP POLICY IF EXISTS "Authenticated users can create pow_tasks" ON public.pow_tasks;
DROP POLICY IF EXISTS "Authenticated users can update pow_tasks" ON public.pow_tasks;
DROP POLICY IF EXISTS "Authenticated users can delete pow_tasks" ON public.pow_tasks;

CREATE POLICY "Authenticated users can view pow_tasks"
    ON public.pow_tasks FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can create pow_tasks"
    ON public.pow_tasks FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update pow_tasks"
    ON public.pow_tasks FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can delete pow_tasks"
    ON public.pow_tasks FOR DELETE
    TO authenticated
    USING (true);

-- STRUCTURES TABLE
ALTER TABLE public.structures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view structures" ON public.structures;
DROP POLICY IF EXISTS "Authenticated users can create structures" ON public.structures;
DROP POLICY IF EXISTS "Authenticated users can update structures" ON public.structures;
DROP POLICY IF EXISTS "Authenticated users can delete structures" ON public.structures;

CREATE POLICY "Authenticated users can view structures"
    ON public.structures FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can create structures"
    ON public.structures FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update structures"
    ON public.structures FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can delete structures"
    ON public.structures FOR DELETE
    TO authenticated
    USING (true);

-- ROUTES TABLE
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view routes" ON public.routes;
DROP POLICY IF EXISTS "Authenticated users can create routes" ON public.routes;
DROP POLICY IF EXISTS "Authenticated users can update routes" ON public.routes;
DROP POLICY IF EXISTS "Authenticated users can delete routes" ON public.routes;

CREATE POLICY "Authenticated users can view routes"
    ON public.routes FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can create routes"
    ON public.routes FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update routes"
    ON public.routes FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can delete routes"
    ON public.routes FOR DELETE
    TO authenticated
    USING (true);

-- KHS_ITEMS TABLE (pricelist items - read-only for all authenticated users)
ALTER TABLE public.khs_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view khs_items" ON public.khs_items;
DROP POLICY IF EXISTS "Authenticated users can manage khs_items" ON public.khs_items;

CREATE POLICY "Authenticated users can view khs_items"
    ON public.khs_items FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can manage khs_items"
    ON public.khs_items FOR ALL
    TO authenticated
    USING (true);

-- KHS_PROVIDERS TABLE
ALTER TABLE public.khs_providers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view khs_providers" ON public.khs_providers;
DROP POLICY IF EXISTS "Authenticated users can manage khs_providers" ON public.khs_providers;

CREATE POLICY "Authenticated users can view khs_providers"
    ON public.khs_providers FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can manage khs_providers"
    ON public.khs_providers FOR ALL
    TO authenticated
    USING (true);

-- =====================================================
-- Grant necessary permissions
-- =====================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- Completion Message
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Authentication setup completed successfully!';
    RAISE NOTICE '1. User profiles table created with RLS';
    RAISE NOTICE '2. Auto-create profile trigger added';
    RAISE NOTICE '3. RLS policies applied to all tables';
    RAISE NOTICE '4. Only authenticated users can access data';
END $$;
