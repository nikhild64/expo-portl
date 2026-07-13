import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';

import { Text } from '@/components';
import { COMPLAINT_PHOTOS_BUCKET, isLocalUri, storageObjectPath, useStorageImageUri } from '@/lib/storage';
import type { Json } from '@/types/database';

function photoValue(item: Json): string | null {
  if (typeof item === 'string') return item;
  if (item && typeof item === 'object' && !Array.isArray(item) && 'path' in item) {
    const path = (item as { path?: unknown }).path;
    return typeof path === 'string' ? path : null;
  }
  return null;
}

export function complaintPhotoPaths(value: Json): string[] {
  if (!value) return [];
  if (typeof value === 'string') {
    try {
      return complaintPhotoPaths(JSON.parse(value) as Json);
    } catch {
      const objectPath = storageObjectPath(value, COMPLAINT_PHOTOS_BUCKET);
      return objectPath ? [objectPath] : [];
    }
  }
  if (!Array.isArray(value)) return [];

  const paths = value.flatMap((item) => {
    const raw = photoValue(item);
    if (!raw?.trim()) return [];
    const objectPath = storageObjectPath(raw, COMPLAINT_PHOTOS_BUCKET);
    return objectPath ? [objectPath] : [];
  });

  return [...new Set(paths)];
}

function ComplaintPhoto({ path }: { path: string }) {
  const [imageError, setImageError] = useState(false);
  const isLocal = isLocalUri(path);
  const { data: uri, isError, isPending, error } = useStorageImageUri(
    COMPLAINT_PHOTOS_BUCKET,
    isLocal ? null : path,
  );
  const displayUri = isLocal ? path : uri;

  if (!isLocal && isPending) {
    return (
      <View style={{ width: 192, height: 144 }} className="items-center justify-center rounded-md bg-surface-tertiary">
        <ActivityIndicator />
      </View>
    );
  }

  if (!isLocal && isError) {
    return (
      <View style={{ width: 192, height: 144 }} className="items-center justify-center rounded-md bg-surface-tertiary px-sm">
        <Text variant="caption" color="textTertiary" className="text-center">
          {error instanceof Error ? error.message : 'Could not load photo'}
        </Text>
      </View>
    );
  }

  if (!displayUri || imageError) {
    return (
      <View style={{ width: 192, height: 144 }} className="items-center justify-center rounded-md bg-surface-tertiary px-sm">
        <Text variant="caption" color="textTertiary" className="text-center">
          Photo unavailable
        </Text>
      </View>
    );
  }

  return (
    <View style={{ width: 192, height: 144, borderRadius: 12, overflow: 'hidden' }}>
      <Image
        source={{ uri: displayUri }}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
        cachePolicy="none"
        onError={() => setImageError(true)}
      />
    </View>
  );
}

interface Props {
  photos: Json;
  dark?: boolean;
}

export function PhotoGrid({ photos }: Props) {
  const paths = complaintPhotoPaths(photos);
  const unresolvedCount = Array.isArray(photos) ? photos.length : 0;

  if (!paths.length) {
    if (unresolvedCount > 0) {
      return (
        <View className="gap-sm">
          <Text variant="caption" color="textSecondary">
            PHOTO EVIDENCE
          </Text>
          <Text variant="footnote" color="textTertiary">
            Photos are attached but could not be loaded. Try raising a new ticket with the latest app version.
          </Text>
        </View>
      );
    }
    return null;
  }

  return (
    <View className="gap-sm">
      <Text variant="caption" color="textSecondary">
        PHOTO EVIDENCE
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
        {paths.map((path) => (
          <ComplaintPhoto key={path} path={path} />
        ))}
      </ScrollView>
    </View>
  );
}
