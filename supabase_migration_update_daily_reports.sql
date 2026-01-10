-- Add status and distribusi_name to daily_reports table
ALTER TABLE daily_reports ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'));
ALTER TABLE daily_reports ADD COLUMN IF NOT EXISTS distribusi_name TEXT;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_dr_status ON daily_reports(status);
CREATE INDEX IF NOT EXISTS idx_dr_distribusi ON daily_reports(distribusi_name);
