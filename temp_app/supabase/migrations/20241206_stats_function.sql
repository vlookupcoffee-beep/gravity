-- Add this to your Supabase SQL Editor
create or replace function calculate_project_route_length(p_id uuid)
returns float
language sql
as $$
  select coalesce(sum(st_length(path::geography)), 0)
  from routes
  where project_id = p_id;
$$;
