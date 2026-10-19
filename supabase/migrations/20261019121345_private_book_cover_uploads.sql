-- Private covers: raster images only, capped at 3 MB after browser preparation.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('book-covers', 'book-covers', false, 3145728, ARRAY['image/jpeg'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authors can upload their book covers" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'book-covers'
  AND (storage.foldername(name))[1] = (select auth.uid())::text
  AND EXISTS (SELECT 1 FROM public.books WHERE id::text = (storage.foldername(name))[2] AND user_id = (select auth.uid()))
);
CREATE POLICY "Authors can read their book covers" ON storage.objects
FOR SELECT TO authenticated USING (
  bucket_id = 'book-covers'
  AND (storage.foldername(name))[1] = (select auth.uid())::text
  AND EXISTS (SELECT 1 FROM public.books WHERE id::text = (storage.foldername(name))[2] AND user_id = (select auth.uid()))
);
