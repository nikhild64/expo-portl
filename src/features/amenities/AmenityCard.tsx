import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';

import { Card, IconSymbol, StatusPill, Text } from '@/components';
import { formatMoney } from '@/lib/format';
import type { Tables } from '@/types/database';

interface Props {
  amenity: Tables<'amenities'>;
  hero?: boolean;
  compact?: boolean;
  onPress?: () => void;
}

function formatHours(from?: string, to?: string) {
  if (!from || !to) return 'Check availability';
  const [fromH] = from.split(':').map(Number);
  const [toH] = to.split(':').map(Number);
  if (fromH === 0 && toH >= 23) return '24/7';
  return `${fromH % 12 || 12} ${fromH >= 12 ? 'PM' : 'AM'}–${toH % 12 || 12} ${toH >= 12 ? 'PM' : 'AM'}`;
}

export function AmenityCard({ amenity, hero, compact, onPress }: Props) {
  const free = (amenity.hourly_price ?? 0) === 0 && (amenity.daily_price ?? 0) === 0;
  const priceLabel = free ? 'Free' : `${formatMoney(amenity.hourly_price ?? amenity.daily_price)}/hr`;

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Amenity: ${amenity.name}`}>
      <Card className={`gap-sm${hero ? '' : ' flex-1'}`} padding={hero ? 'none' : 'base'}>
        {amenity.cover_image_url && (
          <Image
            source={{ uri: amenity.cover_image_url }}
            className={`w-full bg-surface-secondary ${hero ? 'h-44 rounded-t-lg' : compact ? 'h-24 rounded-md' : 'h-36 rounded-lg'}`}
            contentFit="cover"
            transition={200}
          />
        )}
        <View className={hero ? 'gap-sm p-base' : 'gap-sm'}>
          <View className="flex-row items-start justify-between gap-sm">
            <Text variant={hero ? 'title' : 'headline'} className="flex-1">
              {amenity.name}
            </Text>
            {!compact && <StatusPill tone={free ? 'success' : 'info'} label={priceLabel} />}
          </View>

          {compact && (
            <Text variant="footnote" color="textSecondary">
              {formatHours(amenity.available_from, amenity.available_to)}
            </Text>
          )}

          {!compact && (
            <>
              <Text variant="footnote" color="textSecondary" numberOfLines={2}>
                {amenity.description ?? amenity.rules_text ?? 'Available for residents'}
              </Text>
              <View className="flex-row items-center justify-between gap-sm">
                <View className="flex-row items-center gap-xs">
                  <View className="h-2 w-2 rounded-pill bg-success" />
                  <Text variant="caption" color="textSecondary">
                    {formatHours(amenity.available_from, amenity.available_to)}
                  </Text>
                </View>
                {hero && (
                  <View className="flex-row items-center gap-xs">
                    <Text variant="subhead" color="coral">
                      Book now
                    </Text>
                    <IconSymbol name="arrow_forward" size={16} color="coral" />
                  </View>
                )}
              </View>
            </>
          )}
        </View>
      </Card>
    </Pressable>
  );
}
