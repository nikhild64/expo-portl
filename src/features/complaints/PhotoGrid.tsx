import { View } from 'react-native';
import { Image } from 'expo-image';

import { Text } from '@/components';
import { COMPLAINT_PHOTOS_BUCKET, useSignedUrls } from '@/lib/storage';
import type { Json } from '@/types/database';

function photoPaths(value: Json): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

interface Props {
  photos: Json;
}

export function PhotoGrid({ photos }: Props) {
  const paths = photoPaths(photos);
  const signedQueries = useSignedUrls(COMPLAINT_PHOTOS_BUCKET, paths);

  if (!paths.length) return null;

  return (
    <View className="gap-sm">
      <Text variant="caption" color="textSecondary">
        PHOTOS
      </Text>
      <View className="flex-row flex-wrap gap-sm">
        {paths.map((path, index) => {
          const signedUrl = signedQueries[index]?.data;
          if (!signedUrl) {
            return <View key={path} className="h-24 w-[30%] rounded-md bg-surface-secondary" />;
          }

          return (
            <Image
              key={path}
              source={{ uri: signedUrl }}
              className="h-24 w-[30%] rounded-md bg-surface-secondary"
              contentFit="cover"
            />
          );
        })}
      </View>
    </View>
  );
}
