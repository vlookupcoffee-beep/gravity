-- Function untuk insert structure dengan PostGIS geometry
CREATE OR REPLACE FUNCTION insert_structure(
    p_project_id UUID,
    p_name TEXT,
    p_type TEXT,
    p_coordinates TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO structures (project_id, name, type, coordinates, metadata)
    VALUES (
        p_project_id,
        p_name,
        p_type,
        ST_GeomFromText(p_coordinates, 4326),
        p_metadata
    );
END;
$$;

-- Function untuk insert route dengan PostGIS geometry
CREATE OR REPLACE FUNCTION insert_route(
    p_project_id UUID,
    p_name TEXT,
    p_type TEXT,
    p_path TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO routes (project_id, name, type, path, metadata)
    VALUES (
        p_project_id,
        p_name,
        p_type,
        ST_GeomFromText(p_path, 4326),
        p_metadata
    );
END;
$$;
