-- DEFINITIVE FIX FOR DISTRIBUTION TRACKING
-- Run this in Supabase SQL Editor to ensure all constraints are correct.

-- 1. Ensure Columns Exist with Defaults
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='project_material_requirements' AND column_name='distribution_name') THEN
        ALTER TABLE project_material_requirements ADD COLUMN distribution_name TEXT DEFAULT '' NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='material_transactions' AND column_name='distribution_name') THEN
        ALTER TABLE material_transactions ADD COLUMN distribution_name TEXT DEFAULT '' NOT NULL;
    END IF;
END $$;

-- 2. Fix Defaults and NULLs
ALTER TABLE project_material_requirements ALTER COLUMN distribution_name SET DEFAULT '';
UPDATE project_material_requirements SET distribution_name = '' WHERE distribution_name IS NULL;
ALTER TABLE project_material_requirements ALTER COLUMN distribution_name SET NOT NULL;

ALTER TABLE material_transactions ALTER COLUMN distribution_name SET DEFAULT '';
UPDATE material_transactions SET distribution_name = '' WHERE distribution_name IS NULL;
ALTER TABLE material_transactions ALTER COLUMN distribution_name SET NOT NULL;

-- 3. DROP ALL OLD UNIQUE CONSTRAINTS (Clean Slate)
-- We search for any unique constraints involving project_id and material_id
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'project_material_requirements'::regclass
        AND contype = 'u'
    ) LOOP
        EXECUTE 'ALTER TABLE project_material_requirements DROP CONSTRAINT ' || quote_ident(r.conname);
    END LOOP;
END $$;

-- 4. ADD THE CORRECT UNIQUE CONSTRAINT FOR UPSERT
-- This MUST match the 'onConflict' clause in the code exactly.
ALTER TABLE project_material_requirements 
ADD CONSTRAINT project_material_requirements_project_mat_dist_key 
UNIQUE (project_id, material_id, distribution_name);

-- 5. VERIFY & DIAGNOSE
SELECT 'SUCCESS' as status, 'Constraints fixed. You can now try to import or update materials.' as message;
