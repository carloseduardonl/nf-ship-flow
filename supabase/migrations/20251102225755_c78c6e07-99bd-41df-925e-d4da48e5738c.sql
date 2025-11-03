-- Enable realtime for deliveries table
ALTER TABLE public.deliveries REPLICA IDENTITY FULL;

-- Add deliveries table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.deliveries;