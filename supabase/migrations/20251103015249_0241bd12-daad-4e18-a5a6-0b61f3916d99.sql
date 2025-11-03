-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('ADMIN', 'USER');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Migrate existing roles from users table to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, role::app_role
FROM public.users
WHERE role IS NOT NULL;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Update is_user_admin to use new structure
CREATE OR REPLACE FUNCTION public.is_user_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'ADMIN'::app_role)
$$;

-- Update RLS policies to use the new function
DROP POLICY IF EXISTS "Admins can insert companies" ON public.companies;
CREATE POLICY "Admins can insert companies" 
ON public.companies 
FOR INSERT 
TO authenticated
WITH CHECK (public.is_user_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update their company" ON public.companies;
CREATE POLICY "Admins can update their company" 
ON public.companies 
FOR UPDATE 
TO authenticated
USING (id IN (
  SELECT company_id FROM public.users WHERE id = auth.uid() AND public.is_user_admin(id)
));

-- RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'ADMIN'::app_role));