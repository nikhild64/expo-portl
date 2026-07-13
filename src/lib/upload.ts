import { supabase } from '@/lib/supabase';

export async function uploadToStorage(
  bucket: string,
  uri: string,
  path: string,
  contentType = 'image/jpeg',
) {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error(`Could not read image (${response.status})`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const { data, error } = await supabase.storage.from(bucket).upload(path, arrayBuffer, {
    contentType,
    upsert: false,
  });
  if (error) throw error;
  return data.path;
}
