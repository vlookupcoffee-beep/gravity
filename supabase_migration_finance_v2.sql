-- Migration to support Mandor Payment Milestones (OUT)
-- and consolidate RLS fixes

-- 1. Add 'type' column to distinguish Revenue (IN) vs Mandor Payment (OUT)
ALTER TABLE project_payment_milestones 
ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('IN', 'OUT')) DEFAULT 'IN';

-- 2. Consolidate RLS for Finance tables (Web & Bot compatible)
-- We adopt permissive RLS for these tables because authenticating web users
-- with Telegram ID claims in JWT is not yet supported in the custom auth flow.
-- Security is handled at the application level (checkOwnerRole).

DROP POLICY IF EXISTS "Owner Only - Milestones" ON project_payment_milestones;
DROP POLICY IF EXISTS "Permissive access for finance" ON project_payment_milestones;
CREATE POLICY "Permissive access for finance" ON project_payment_milestones 
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Owner Only - Expenses" ON expenses;
DROP POLICY IF EXISTS "Permissive access for finance" ON expenses;
CREATE POLICY "Permissive access for finance" ON expenses 
    FOR ALL USING (true) WITH CHECK (true);

-- Ensure RLS is active
ALTER TABLE project_payment_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
