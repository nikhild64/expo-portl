import type { TFunction } from 'i18next';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { alert } from '@/lib/alert';
import { supabase } from '@/lib/supabase';

import { uploadToStorage } from './upload';

export function storageImagePath(prefix?: string) {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  return prefix ? `${prefix}/${stamp}` : stamp;
}

export async function compressImage(uri: string, options: { width: number; compress?: number }) {
  const context = ImageManipulator.manipulate(uri);
  context.resize({ width: options.width });
  const image = await context.renderAsync();
  return image.saveAsync({ compress: options.compress ?? 0.8, format: SaveFormat.JPEG });
}

export function pickImageSource(options: {
  title: string;
  message: string;
  takePhotoLabel: string;
  galleryLabel: string;
  cancelLabel: string;
  onCamera: () => void | Promise<void>;
  onGallery: () => void | Promise<void>;
}) {
  alert(options.title, options.message, [
    { text: options.takePhotoLabel, onPress: () => void options.onCamera() },
    { text: options.galleryLabel, onPress: () => void options.onGallery() },
    { text: options.cancelLabel, style: 'cancel' },
  ]);
}

export function pickImageSourceI18n(
  t: TFunction,
  options: {
    titleKey: string;
    messageKey: string;
    onCamera: () => void | Promise<void>;
    onGallery: () => void | Promise<void>;
  },
) {
  pickImageSource({
    title: t(options.titleKey),
    message: t(options.messageKey),
    takePhotoLabel: t('alert.buttons.takePhoto'),
    galleryLabel: t('alert.buttons.chooseFromGallery'),
    cancelLabel: t('common.cancel'),
    onCamera: options.onCamera,
    onGallery: options.onGallery,
  });
}

export async function uploadPrivateImage(
  bucket: string,
  uri: string,
  options?: { path?: string; prefix?: string; width?: number; compress?: number },
) {
  const normalized = options?.width
    ? await compressImage(uri, { width: options.width, compress: options.compress })
    : { uri };
  const path = options?.path ?? storageImagePath(options?.prefix);
  await uploadToStorage(bucket, normalized.uri, path);
  return path;
}

export async function uploadPublicImage(
  bucket: string,
  uri: string,
  path: string,
  options?: { width?: number; compress?: number },
) {
  const normalized = options?.width ? await compressImage(uri, { width: options.width, compress: options.compress }) : { uri };
  await uploadToStorage(bucket, normalized.uri, path);
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export async function takeCameraPhoto(options?: { allowsEditing?: boolean; aspect?: [number, number] }) {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: options?.allowsEditing,
    aspect: options?.aspect,
    mediaTypes: ['images'],
    quality: 0.8,
  });

  return result.canceled ? null : result.assets[0]?.uri ?? null;
}

export async function pickGalleryPhotos(options?: {
  allowsEditing?: boolean;
  aspect?: [number, number];
  allowsMultipleSelection?: boolean;
  selectionLimit?: number;
}) {
  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: options?.allowsEditing,
    allowsMultipleSelection: options?.allowsMultipleSelection,
    aspect: options?.aspect,
    mediaTypes: ['images'],
    quality: 0.8,
    selectionLimit: options?.selectionLimit,
  });

  if (result.canceled) return [];
  return result.assets.map((asset) => asset.uri);
}
