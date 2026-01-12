-- Migration to add Expense and Payment Milestone tracking
-- This script creates tables for owner-only financial tracking

-- 1. Create Payment Milestones table
CREATE TABLE IF NOT EXISTS project_payment_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    percentage NUMERIC NOT NULL,
    amount NUMERIC,
    trigger_condition TEXT CHECK (trigger_condition IN ('manual', 'field_progress', 'total_progress', 'status')),
    trigger_value NUMERIC,
    is_paid BOOLEAN DEFAULT false,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    category TEXT, -- 'Material', 'Gaji', 'Operasional', dll
    description TEXT,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by BIGINT REFERENCES telegram_authorized_users(telegram_id)
);

-- 3. Enable RLS
ALTER TABLE project_payment_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- 4. Create Owner-Only Policies
-- We assume owner is defined in telegram_authorized_users with is_admin = true

-- Policy for project_payment_milestones
DROP POLICY IF EXISTS "Owner Only - Milestones" ON project_payment_milestones;
CREATE POLICY "Owner Only - Milestones" ON project_payment_milestones
    USING (
        EXISTS (
            SELECT 1 FROM telegram_authorized_users 
            WHERE is_admin = true 
            AND telegram_id = (auth.jwt()->>'telegram_id')::bigint -- Integration with Telegram Auth flow
        )
    );

-- Policy for expenses
DROP POLICY IF EXISTS "Owner Only - Expenses" ON expenses;
CREATE POLICY "Owner Only - Expenses" ON expenses
    USING (
        EXISTS (
            SELECT 1 FROM telegram_authorized_users 
            WHERE is_admin = true 
            AND telegram_id = (auth.jwt()->>'telegram_id')::bigint
        )
    );

-- Note: For web view, if auth.uid() is used instead of telegram_id in JWT, 
-- we need to adjust the subquery to match how the owner is authenticated on Web.
