
-- 1. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id UUID,
    action TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Project Plans (S-Curve Target) Table
CREATE TABLE IF NOT EXISTS public.project_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    target_date DATE NOT NULL,
    target_progress float NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, target_date)
);

-- 3. Create Project Progress History (S-Curve Realization) Table
CREATE TABLE IF NOT EXISTS public.project_progress_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    record_date DATE NOT NULL DEFAULT CURRENT_DATE,
    actual_progress float NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, record_date)
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON public.audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_project_plans_project_id ON public.project_plans(project_id);
CREATE INDEX IF NOT EXISTS idx_project_progress_history_project_id ON public.project_progress_history(project_id);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_progress_history ENABLE ROW LEVEL SECURITY;

-- Policies (Simplified for owner access)
CREATE POLICY "Allow all for owner in audit_logs" ON public.audit_logs FOR ALL USING (true);
CREATE POLICY "Allow all for owner in project_plans" ON public.project_plans FOR ALL USING (true);
CREATE POLICY "Allow all for owner in project_progress_history" ON public.project_progress_history FOR ALL USING (true);
