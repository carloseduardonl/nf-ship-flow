-- Create storage bucket for NF documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('nf-documents', 'nf-documents', false);

-- Create RLS policies for nf-documents bucket

-- Policy: Users can upload files to their company folder
CREATE POLICY "Users can upload NF documents to their company folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'nf-documents'
  AND (storage.foldername(name))[1] IN (
    SELECT company_id::text FROM public.users WHERE id = auth.uid()
  )
);

-- Policy: Users can view files from their company folder
CREATE POLICY "Users can view their company NF documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'nf-documents'
  AND (storage.foldername(name))[1] IN (
    SELECT company_id::text FROM public.users WHERE id = auth.uid()
  )
);

-- Policy: Users can delete files from their company folder
CREATE POLICY "Users can delete their company NF documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'nf-documents'
  AND (storage.foldername(name))[1] IN (
    SELECT company_id::text FROM public.users WHERE id = auth.uid()
  )
);