-- Create security definer function to get user's company_id
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT company_id
  FROM public.users
  WHERE id = _user_id
$$;

-- Drop existing policy
DROP POLICY IF EXISTS "Users can view users from their company" ON public.users;

-- Recreate policy using the security definer function
CREATE POLICY "Users can view users from their company" 
ON public.users 
FOR SELECT 
USING (company_id = public.get_user_company_id(auth.uid()));