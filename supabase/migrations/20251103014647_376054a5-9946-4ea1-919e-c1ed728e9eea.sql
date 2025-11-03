-- Create policy to allow admins to insert new companies (for partner companies)
CREATE POLICY "Admins can insert companies" 
ON public.companies 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'ADMIN'
  )
);