import { View } from 'react-native';
import { Image } from 'expo-image';

import { Text } from '@/components';
import type { Json } from '@/types/database';

function photoUrls(value: Json): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

interface Props {
  photos: Json;
}

export function PhotoGrid({ photos }: Props) {
  const urls = photoUrls(photos);
  if (!urls.length) return null;

  return (
    <View className="gap-sm">
      <Text variant="caption" color="textSecondary">
        PHOTOS
      </Text>
      <View className="flex-row flex-wrap gap-sm">
        {urls.map((url) => (
          <Image key={url} source={{ uri: url }} className="h-24 w-[30%] rounded-md bg-surface-secondary" contentFit="cover" />
        ))}
      </View>
    </View>
  );
}
