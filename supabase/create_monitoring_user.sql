-- Create Monitoring User (Restricted Viewer)
-- Username: monitoring_user
-- Password: monitoringUpdate2024!
-- Role: restricted_viewer

INSERT INTO public.login (id, username, password, role)
SELECT gen_random_uuid(), 'monitoring_user', 'monitoringUpdate2024!', 'restricted_viewer'
WHERE NOT EXISTS (
    SELECT 1 FROM public.login WHERE username = 'monitoring_user'
);

-- Output created user for verification
SELECT username, role, password FROM public.login WHERE username = 'monitoring_user';
