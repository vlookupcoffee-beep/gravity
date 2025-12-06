-- Enable PostGIS for geospatial storage
create extension if not exists postgis;

-- Projects Table (Groups data elements)
create table if not exists projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Structures (Points like Manholes, Poles, Handholes)
create table if not exists structures (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade,
  name text not null, -- e.g., "MH-120"
  type text, -- e.g., "MH", "HH", "POLE"
  coordinates geometry(Point, 4326), -- PostGIS Point
  metadata jsonb default '{}'::jsonb, -- Store extra properties from KML
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create a spatial index for structures
create index if not exists structures_geo_idx on structures using GIST (coordinates);

-- Routes (Lines like Cables, Ducts)
create table if not exists routes (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade,
  name text not null, -- e.g., "KFD 96C"
  type text, -- e.g., "CABLE", "HDPE"
  path geometry(LineString, 4326), -- PostGIS LineString
  length_meters float, -- Calculated length
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create a spatial index for routes
create index if not exists routes_geo_idx on routes using GIST (path);

-- Enable RLS (Row Level Security)
alter table projects enable row level security;
alter table structures enable row level security;
alter table routes enable row level security;

-- Policies (Public Read / Authenticated Write for now - adjust as needed)
create policy "Enable read access for all users" on projects for select using (true);
create policy "Enable insert for service key only" on projects for insert with check (true); -- Simplified for initial dev

create policy "Enable read access for all users" on structures for select using (true);
create policy "Enable insert for service key only" on structures for insert with check (true);

create policy "Enable read access for all users" on routes for select using (true);
create policy "Enable insert for service key only" on routes for insert with check (true);
