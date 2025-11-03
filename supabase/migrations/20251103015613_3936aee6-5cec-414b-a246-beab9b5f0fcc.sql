-- Drop existing table and recreate without auth.users reference
DROP TABLE IF EXISTS public.user_roles CASCADE;

-- Recreate user_roles without foreign key to auth.users
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Migrate existing roles from users table
INSERT INTO public.user_roles (user_id, role)
SELECT id, role::app_role
FROM public.users
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- RLS policies for user_roles
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

-- Update handle_new_user trigger to create role entry
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_company_id uuid;
BEGIN
  IF NEW.raw_user_meta_data->>'company_name' IS NOT NULL THEN
    -- Create company
    INSERT INTO public.companies (name, cnpj, email, phone, address, type)
    VALUES (
      NEW.raw_user_meta_data->>'company_name',
      NEW.raw_user_meta_data->>'cnpj',
      NEW.raw_user_meta_data->>'company_email',
      NEW.raw_user_meta_data->>'company_phone',
      NEW.raw_user_meta_data->>'address',
      NEW.raw_user_meta_data->>'company_type'
    )
    RETURNING id INTO v_company_id;

    -- Create user profile
    INSERT INTO public.users (id, company_id, full_name, email, role, is_active)
    VALUES (
      NEW.id,
      v_company_id,
      NEW.raw_user_meta_data->>'full_name',
      NEW.email,
      'ADMIN',
      true
    );
    
    -- Create user role entry
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'ADMIN'::app_role);
  END IF;
  
  RETURN NEW;
END;
$$;