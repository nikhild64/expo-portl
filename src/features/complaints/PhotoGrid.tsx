import { ScrollView, View } from 'react-native';
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
  dark?: boolean;
}

export function PhotoGrid({ photos, dark = false }: Props) {
  const paths = photoPaths(photos);
  const signedQueries = useSignedUrls(COMPLAINT_PHOTOS_BUCKET, paths);

  if (!paths.length) return null;

  return (
    <View className="gap-sm">
      <Text variant="caption" color={dark ? 'textSecondary' : 'textSecondary'}>
        PHOTO EVIDENCE
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
        {paths.map((path, index) => {
          const signedUrl = signedQueries[index]?.data;
          if (!signedUrl) {
            return <View key={path} className="h-36 w-48 rounded-md bg-surface-tertiary" />;
          }

          return (
            <Image
              key={path}
              source={{ uri: signedUrl }}
              className="h-36 w-48 rounded-md bg-surface-tertiary"
              contentFit="cover"
            />
          );
        })}
      </ScrollView>
    </View>
  );
}
