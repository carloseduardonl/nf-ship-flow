-- Criar função para lidar com novos usuários
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
    RETURNING id INTO NEW.raw_user_meta_data;

    -- Depois cria o perfil do usuário
    INSERT INTO public.users (id, company_id, full_name, email, role, is_active)
    VALUES (
      NEW.id,
      (SELECT id FROM public.companies WHERE cnpj = NEW.raw_user_meta_data->>'cnpj' ORDER BY created_at DESC LIMIT 1),
      NEW.raw_user_meta_data->>'full_name',
      NEW.email,
      'ADMIN',
      true
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger para novos usuários
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();