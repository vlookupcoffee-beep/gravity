-- Create a secure login function to bypass RLS issues on the table
DROP FUNCTION IF EXISTS login_user(TEXT, TEXT);

CREATE OR REPLACE FUNCTION login_user(p_username TEXT, p_password TEXT)
RETURNS TABLE (
    user_id TEXT,
    user_username TEXT,
    user_role TEXT
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT id::text, username, role
    FROM login
    WHERE username = p_username AND password = p_password;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to anon and service_role
GRANT EXECUTE ON FUNCTION login_user(TEXT, TEXT) TO anon, service_role, authenticated;
