import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';

import { Card, StatusPill, Text } from '@/components';
import { formatMoney } from '@/lib/format';
import type { Tables } from '@/types/database';

interface Props {
  amenity: Tables<'amenities'>;
  hero?: boolean;
  onPress?: () => void;
}

export function AmenityCard({ amenity, hero, onPress }: Props) {
  const free = (amenity.hourly_price ?? 0) === 0 && (amenity.daily_price ?? 0) === 0;

  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      <Card className={`gap-sm${hero ? '' : ' flex-1'}`} padding={hero ? 'none' : 'base'}>
        {amenity.cover_image_url && (
          <Image source={{ uri: amenity.cover_image_url }} className="h-36 w-full rounded-lg bg-surface-secondary" contentFit="cover" />
        )}
        <View className={hero ? 'p-base gap-sm' : 'gap-sm'}>
          <View className="flex-row items-center justify-between gap-sm">
            <Text variant={hero ? 'title' : 'headline'}>{amenity.name}</Text>
            <StatusPill tone={free ? 'success' : 'info'} label={free ? 'Free' : formatMoney(amenity.hourly_price ?? amenity.daily_price)} />
          </View>
          <Text variant="footnote" color="textSecondary" numberOfLines={2}>
            {amenity.description ?? amenity.rules_text ?? 'Available for residents'}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}
