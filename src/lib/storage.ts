import { useQueries, useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export const VISITOR_PHOTOS_BUCKET = 'visitor-photos';
export const COMPLAINT_PHOTOS_BUCKET = 'complaint-photos';

const DEFAULT_TTL_SECONDS = 3600;

export function isLocalUri(value: string) {
  return value.startsWith('file://') || value.startsWith('content://');
}

/** Normalize a storage object path from a bare path or legacy public/signed URL. */
export function storageObjectPath(value: string | null | undefined, bucket: string): string | null {
  if (!value) return null;
  if (isLocalUri(value)) return value;
  if (!value.startsWith('http://') && !value.startsWith('https://')) return value;

  for (const marker of [`/storage/v1/object/public/${bucket}/`, `/storage/v1/object/sign/${bucket}/`]) {
    const idx = value.indexOf(marker);
    if (idx >= 0) {
      const rest = value.slice(idx + marker.length);
      return rest.split('?')[0] ?? rest;
    }
  }

  return null;
}

export async function createSignedUrl(bucket: string, path: string, ttl = DEFAULT_TTL_SECONDS) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, ttl);
  if (error) throw error;
  return data.signedUrl;
}

export function useSignedUrl(bucket: string, path: string | null | undefined, ttl = DEFAULT_TTL_SECONDS) {
  const objectPath = path ? storageObjectPath(path, bucket) : null;
  const enabled = !!objectPath && !isLocalUri(objectPath);

  return useQuery({
    queryKey: ['signed-url', bucket, objectPath, ttl],
    queryFn: () => createSignedUrl(bucket, objectPath!, ttl),
    enabled,
    staleTime: Math.max(0, (ttl - 60) * 1000),
    gcTime: ttl * 1000,
  });
}

export function useSignedUrls(bucket: string, paths: string[], ttl = DEFAULT_TTL_SECONDS) {
  const objectPaths = paths
    .map((path) => storageObjectPath(path, bucket))
    .filter((path): path is string => !!path && !isLocalUri(path));

  return useQueries({
    queries: objectPaths.map((path) => ({
      queryKey: ['signed-url', bucket, path, ttl],
      queryFn: () => createSignedUrl(bucket, path, ttl),
      staleTime: Math.max(0, (ttl - 60) * 1000),
      gcTime: ttl * 1000,
    })),
  });
}
