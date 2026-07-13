-- Store storage object paths (not public URLs) and let residents read their flat's visitor photos.

ALTER TABLE public.visitors RENAME COLUMN visitor_photo_url TO visitor_photo_path;

UPDATE public.visitors
SET visitor_photo_path = regexp_replace(
  visitor_photo_path,
  '^https?://[^/]+/storage/v1/object/(?:public|sign)/visitor-photos/(.+?)(\?.*)?$',
  '\1'
)
WHERE visitor_photo_path LIKE 'http%';

UPDATE public.complaints
SET photos = (
  SELECT COALESCE(
    jsonb_agg(
      CASE
        WHEN jsonb_typeof(value) = 'string' AND value #>> '{}' ~ '^https?://'
        THEN to_jsonb(
          regexp_replace(
            value #>> '{}',
            '^https?://[^/]+/storage/v1/object/(?:public|sign)/complaint-photos/(.+?)(\?.*)?$',
            '\1'
          )
        )
        ELSE value
      END
    ),
    '[]'::jsonb
  )
  FROM jsonb_array_elements(photos) AS value
)
WHERE photos::text LIKE '%http%';

CREATE POLICY "visitor_photos_select_resident_flat"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'visitor-photos'
  AND EXISTS (
    SELECT 1
    FROM public.visitors v
    JOIN public.flat_residents fr ON fr.flat_id = v.flat_id
    WHERE v.visitor_photo_path = storage.objects.name
      AND fr.profile_id = auth.uid()
  )
);
