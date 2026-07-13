import * as FileSystem from 'expo-file-system/legacy';

import { env } from '@/env';
import { supabase } from '@/lib/supabase';

export async function uploadToStorage(
  bucket: string,
  uri: string,
  path: string,
  contentType = 'image/jpeg',
) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const url = `${env.supabaseUrl}/storage/v1/object/${bucket}/${path}`;
  const res = await FileSystem.uploadAsync(url, uri, {
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
      'x-upsert': 'false',
      'Content-Type': contentType,
    },
  });
  if (res.status >= 300) throw new Error(`Upload failed: ${res.status} ${res.body}`);
  return path;
}
