-- Allow public/bot to insert transactions (Stock OUT) without login session
-- This is needed for the Telegram Webhook if no Service Key is configured.

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON material_transactions;

-- Allow Insert for everyone (or you could restrict to a specific API key header checks in the policy if advanced, but this is simple)
CREATE POLICY "Enable insert public" ON material_transactions FOR INSERT WITH CHECK (true);

-- Ensure Update is also allowed if we ever need to correct transactions (optional)
DROP POLICY IF EXISTS "Enable update for authenticated users" ON material_transactions;
CREATE POLICY "Enable update public" ON material_transactions FOR UPDATE USING (true);
