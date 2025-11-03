-- Ensure all existing users have their roles in user_roles table
INSERT INTO public.user_roles (user_id, role)
SELECT id, role::app_role
FROM public.users
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;