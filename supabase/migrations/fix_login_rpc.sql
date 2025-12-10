-- Create a secure login function to bypass RLS issues on the table
CREATE OR REPLACE FUNCTION login_user(p_username TEXT, p_password TEXT)
RETURNS TABLE (
    user_id UUID,
    user_username TEXT,
    user_role TEXT
) 
SECURITY DEFINER -- This function runs with the privileges of the creator (postgres/superuser), bypassing RLS
SET search_path = public -- Secure search path
AS $$
BEGIN
    RETURN QUERY
    SELECT id, username, role
    FROM login
    WHERE username = p_username AND password = p_password;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to anon and service_role
GRANT EXECUTE ON FUNCTION login_user(TEXT, TEXT) TO anon, service_role, authenticated;
