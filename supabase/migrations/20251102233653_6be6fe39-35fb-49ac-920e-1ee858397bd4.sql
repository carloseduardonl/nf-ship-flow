-- Adicionar campo de preferências de notificação aos usuários
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "email_ball_with_me": true,
  "email_delivery_confirmed": true,
  "email_message_received": true,
  "email_daily_summary": false,
  "push_notifications": false
}'::jsonb;

-- Criar bucket de avatars se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies para avatars
CREATE POLICY "Users can view all avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir que usuários atualizem seu próprio perfil
CREATE POLICY "Users can update their own profile"
ON public.users FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Permitir que admins atualizem dados da empresa
CREATE POLICY "Admins can update their company"
ON public.companies FOR UPDATE
USING (
  id IN (
    SELECT company_id FROM users 
    WHERE id = auth.uid() AND role = 'ADMIN'
  )
);