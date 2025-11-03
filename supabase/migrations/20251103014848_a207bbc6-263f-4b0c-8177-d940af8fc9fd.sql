-- Create security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_user_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = _user_id
    AND role = 'ADMIN'
  )
$$;

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can insert companies" ON public.companies;

-- Recreate policy using the security definer function
CREATE POLICY "Admins can insert companies" 
ON public.companies 
FOR INSERT 
TO authenticated
WITH CHECK (public.is_user_admin(auth.uid()));