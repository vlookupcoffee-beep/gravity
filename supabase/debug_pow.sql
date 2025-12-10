-- Check if data exists
SELECT 'projects' as table_name, count(*) as row_count FROM projects
UNION ALL
SELECT 'pow_tasks' as table_name, count(*) as row_count FROM pow_tasks;

-- If pow_tasks exists, show a few
SELECT * FROM pow_tasks LIMIT 5;
