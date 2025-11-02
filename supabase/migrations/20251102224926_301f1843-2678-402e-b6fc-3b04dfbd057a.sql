-- COMPANIES POLICIES
CREATE POLICY "Users can view their own company"
ON public.companies
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT company_id 
    FROM public.users 
    WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can view related companies"
ON public.companies
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT seller_company_id FROM public.company_relationships 
    WHERE buyer_company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
    UNION
    SELECT buyer_company_id FROM public.company_relationships 
    WHERE seller_company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
  )
);

-- USERS POLICIES
CREATE POLICY "Users can view users from their company"
ON public.users
FOR SELECT
TO authenticated
USING (
  company_id = (
    SELECT company_id 
    FROM public.users 
    WHERE id = auth.uid()
  )
);

-- DELIVERIES POLICIES
CREATE POLICY "Users can view their company deliveries"
ON public.deliveries
FOR SELECT
TO authenticated
USING (
  seller_company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
  OR buyer_company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
);

CREATE POLICY "Sellers can create deliveries"
ON public.deliveries
FOR INSERT
TO authenticated
WITH CHECK (
  seller_company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
);

CREATE POLICY "Involved parties can update deliveries"
ON public.deliveries
FOR UPDATE
TO authenticated
USING (
  seller_company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
  OR buyer_company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
);

-- DELIVERY_TIMELINE POLICIES
CREATE POLICY "Users can view timeline of their deliveries"
ON public.delivery_timeline
FOR SELECT
TO authenticated
USING (
  delivery_id IN (
    SELECT id FROM public.deliveries
    WHERE seller_company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
    OR buyer_company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
  )
);

CREATE POLICY "Users can insert timeline entries"
ON public.delivery_timeline
FOR INSERT
TO authenticated
WITH CHECK (
  delivery_id IN (
    SELECT id FROM public.deliveries
    WHERE seller_company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
    OR buyer_company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
  )
);

-- DELIVERY_MESSAGES POLICIES
CREATE POLICY "Users can view messages of their deliveries"
ON public.delivery_messages
FOR SELECT
TO authenticated
USING (
  delivery_id IN (
    SELECT id FROM public.deliveries
    WHERE seller_company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
    OR buyer_company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
  )
);

CREATE POLICY "Users can insert messages"
ON public.delivery_messages
FOR INSERT
TO authenticated
WITH CHECK (
  delivery_id IN (
    SELECT id FROM public.deliveries
    WHERE seller_company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
    OR buyer_company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
  )
);

-- NOTIFICATIONS POLICIES
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- COMPANY_RELATIONSHIPS POLICIES
CREATE POLICY "Users can view their company relationships"
ON public.company_relationships
FOR SELECT
TO authenticated
USING (
  seller_company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
  OR buyer_company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
);

CREATE POLICY "Admins can insert relationships"
ON public.company_relationships
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'ADMIN'
  )
);

CREATE POLICY "Admins can update relationships"
ON public.company_relationships
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'ADMIN'
  )
);

CREATE POLICY "Admins can delete relationships"
ON public.company_relationships
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'ADMIN'
  )
);