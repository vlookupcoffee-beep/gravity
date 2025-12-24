-- Drop existing policies to be clean
DROP POLICY IF EXISTS "Enable read access for all users" ON materials;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON materials;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON materials;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON materials;
DROP POLICY IF EXISTS "Enable all for anon users" ON materials;

-- Re-create permissive policies for Public/Anon users (Unblocks "Violates RLS" error)
-- We use TO public so it applies to everyone (Anon + Authenticated)

CREATE POLICY "Enable all for public"
ON materials FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Ensure the same for transactions
DROP POLICY IF EXISTS "Enable read access for all users" ON material_transactions;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON material_transactions;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON material_transactions;

CREATE POLICY "Enable all for public"
ON material_transactions FOR ALL
TO public
USING (true)
WITH CHECK (true);
