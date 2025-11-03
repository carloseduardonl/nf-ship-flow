-- Drop existing policy
DROP POLICY IF EXISTS "Admins can insert companies" ON public.companies;

-- Recreate with explicit schema prefix and TO authenticated
CREATE POLICY "Admins can insert companies"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (public.is_user_admin(auth.uid()));

-- Debug function to check auth context
CREATE OR REPLACE FUNCTION public.debug_auth_context()
RETURNS TABLE (
  current_user_id uuid,
  is_admin boolean,
  has_admin_role boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    auth.uid(),
    public.is_user_admin(auth.uid()),
    public.has_role(auth.uid(), 'ADMIN'::app_role)
$$;