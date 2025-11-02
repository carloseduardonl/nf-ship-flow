-- Permitir que usuários criem notificações para outros usuários da mesma empresa
CREATE POLICY "Users can insert notifications for their deliveries"
ON public.notifications
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM deliveries d
    WHERE d.id = delivery_id
      AND (
        d.seller_company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
        OR d.buyer_company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
      )
  )
);