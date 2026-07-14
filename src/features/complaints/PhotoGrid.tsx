import { Image } from 'expo-image';
import { errorMessage } from '@/lib/alert';
import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components';
import {
  COMPLAINT_PHOTOS_BUCKET,
  isLocalUri,
  storageObjectPath,
  useStorageImageUriMap,
} from '@/lib/storage';
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

function ComplaintPhoto({
  path,
  uri,
  isPending,
  error,
}: {
  path: string;
  uri?: string;
  isPending: boolean;
  error: unknown;
}) {
  const { t } = useTranslation();
  const [imageError, setImageError] = useState(false);
  const isLocal = isLocalUri(path);
  const displayUri = isLocal ? path : uri;

  if (!isLocal && isPending) {
    return (
      <View style={{ width: 192, height: 144 }} className="items-center justify-center rounded-md bg-surface-tertiary">
        <ActivityIndicator />
      </View>
    );
  }

  if (!isLocal && error) {
    return (
      <View style={{ width: 192, height: 144 }} className="items-center justify-center rounded-md bg-surface-tertiary px-sm">
        <Text variant="caption" color="textTertiary" className="text-center">
          {errorMessage(error, t('resident.complaints.couldNotLoadPhoto'))}
        </Text>
      </View>
    );
  }

  if (!displayUri || imageError) {
    return (
      <View style={{ width: 192, height: 144 }} className="items-center justify-center rounded-md bg-surface-tertiary px-sm">
        <Text variant="caption" color="textTertiary" className="text-center">
          {t('resident.complaints.photoUnavailable')}
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
  const { t } = useTranslation();
  const paths = useMemo(() => complaintPhotoPaths(photos), [photos]);
  const remotePaths = useMemo(() => paths.filter((path) => !isLocalUri(path)), [paths]);
  const { map: uriMap, errors, isPending } = useStorageImageUriMap(COMPLAINT_PHOTOS_BUCKET, remotePaths);
  const unresolvedCount = Array.isArray(photos) ? photos.length : 0;

  if (!paths.length) {
    if (unresolvedCount > 0) {
      return (
        <View className="gap-sm">
          <Text variant="caption" color="textSecondary">
            {t('resident.complaints.photoEvidence')}
          </Text>
          <Text variant="footnote" color="textTertiary">
            {t('resident.complaints.photosNotLoaded')}
          </Text>
        </View>
      );
    }
    return null;
  }

  return (
    <View className="gap-sm">
      <Text variant="caption" color="textSecondary">
        {t('resident.complaints.photoEvidence')}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
        {paths.map((path) => (
          <ComplaintPhoto
            key={path}
            path={path}
            uri={uriMap.get(path)}
            isPending={!isLocalUri(path) && isPending && !uriMap.has(path)}
            error={errors.get(path)}
          />
        ))}
      </ScrollView>
    </View>
  );
}
