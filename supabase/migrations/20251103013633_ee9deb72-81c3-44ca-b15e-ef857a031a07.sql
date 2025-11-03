-- Fix the handle_new_user function to properly handle company creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_company_id uuid;
BEGIN
  -- Apenas cria o usuário se os dados da empresa estiverem presentes nos metadados
  IF NEW.raw_user_meta_data->>'company_name' IS NOT NULL THEN
    -- Primeiro cria a empresa
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

    -- Depois cria o perfil do usuário
    INSERT INTO public.users (id, company_id, full_name, email, role, is_active)
    VALUES (
      NEW.id,
      v_company_id,
      NEW.raw_user_meta_data->>'full_name',
      NEW.email,
      'ADMIN',
      true
    );
  END IF;
  
  RETURN NEW;
END;
$function$;