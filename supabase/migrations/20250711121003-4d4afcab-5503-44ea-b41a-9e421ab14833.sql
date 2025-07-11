
-- Create a security definer function to check auth methods for email
-- This function runs with elevated privileges to bypass RLS restrictions
CREATE OR REPLACE FUNCTION public.check_auth_methods_for_email(user_email TEXT)
RETURNS TABLE (
  user_id UUID,
  has_password BOOLEAN,
  has_biometric BOOLEAN,
  biometric_types TEXT[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    TRUE as has_password, -- Assume password exists if profile exists
    COALESCE(p.biometric_enabled, FALSE) as has_biometric,
    ARRAY(
      SELECT unnest(
        CASE 
          WHEN p.fingerprint_enabled THEN ARRAY['fingerprint']
          ELSE ARRAY[]::TEXT[]
        END ||
        CASE 
          WHEN p.face_id_enabled THEN ARRAY['face']
          ELSE ARRAY[]::TEXT[]
        END
      )
    ) as biometric_types
  FROM public.profiles p
  WHERE p.email = user_email
  LIMIT 1;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.check_auth_methods_for_email(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_auth_methods_for_email(TEXT) TO anon;
