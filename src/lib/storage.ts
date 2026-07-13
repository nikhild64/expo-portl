import { useQueries, useQuery } from '@tanstack/react-query';
import * as FileSystem from 'expo-file-system/legacy';

import { supabase } from '@/lib/supabase';

export const VISITOR_PHOTOS_BUCKET = 'visitor-photos';
export const COMPLAINT_PHOTOS_BUCKET = 'complaint-photos';
export const SOCIETY_LOGOS_BUCKET = 'society-logos';

const DEFAULT_TTL_SECONDS = 3600;

export function isLocalUri(value: string) {
  return value.startsWith('file://') || value.startsWith('content://');
}

/** Normalize a storage object path from a bare path or legacy public/signed URL. */
export function storageObjectPath(value: string | null | undefined, bucket: string): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (isLocalUri(trimmed)) return trimmed;

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    for (const marker of [
      `/storage/v1/object/public/${bucket}/`,
      `/storage/v1/object/sign/${bucket}/`,
      `/storage/v1/object/authenticated/${bucket}/`,
    ]) {
      const idx = trimmed.indexOf(marker);
      if (idx >= 0) {
        const rest = trimmed.slice(idx + marker.length);
        try {
          return decodeURIComponent(rest.split('?')[0] ?? rest);
        } catch {
          return rest.split('?')[0] ?? rest;
        }
      }
    }
    return null;
  }

  const bucketPrefix = `${bucket}/`;
  if (trimmed.startsWith(bucketPrefix)) return trimmed.slice(bucketPrefix.length);
  if (trimmed.startsWith('/')) return trimmed.slice(1);
  return trimmed;
}

export async function createSignedUrl(bucket: string, path: string, ttl = DEFAULT_TTL_SECONDS) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, ttl);
  if (error) throw error;
  return data.signedUrl;
}

/** Download a private storage object to a local file URI for React Native image rendering. */
export async function resolveStorageImageUri(bucket: string, path: string) {
  const objectPath = storageObjectPath(path, bucket);
  if (!objectPath) throw new Error('Invalid storage path');
  if (isLocalUri(objectPath)) return objectPath;

  const cachePath = `${FileSystem.cacheDirectory}${bucket}--${objectPath.replace(/\//g, '__')}.jpg`;
  const info = await FileSystem.getInfoAsync(cachePath);
  if (info.exists) return cachePath;

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(objectPath, DEFAULT_TTL_SECONDS);
  if (error || !data?.signedUrl) throw error ?? new Error('Could not sign photo URL');

  const download = await FileSystem.downloadAsync(data.signedUrl, cachePath);
  if (download.status !== 200) {
    throw new Error(`Download failed (${download.status})`);
  }

  return download.uri;
}

export function useStorageImageUri(bucket: string, path: string | null | undefined) {
  const objectPath = path ? storageObjectPath(path, bucket) : null;
  const enabled = !!objectPath && !isLocalUri(objectPath);

  return useQuery({
    queryKey: ['storage-image-uri', bucket, objectPath],
    queryFn: () => resolveStorageImageUri(bucket, objectPath!),
    enabled,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
  });
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
  return useQueries({
    queries: paths.map((path) => {
      const objectPath = path ? storageObjectPath(path, bucket) : null;
      const enabled = !!objectPath && !isLocalUri(objectPath);

      return {
        queryKey: ['signed-url', bucket, objectPath, ttl],
        queryFn: () => createSignedUrl(bucket, objectPath!, ttl),
        enabled,
        staleTime: Math.max(0, (ttl - 60) * 1000),
        gcTime: ttl * 1000,
      };
    }),
  });
}
