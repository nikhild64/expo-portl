import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';

import { Card, Button, IconSymbol, StatusPill, Text } from '@/components';
import { formatMoney } from '@/lib/format';
import type { Tables } from '@/types/database';

interface Props {
  amenity: Tables<'amenities'>;
  hero?: boolean;
  compact?: boolean;
  onPress?: () => void;
  onBookingsPress?: () => void;
}

function formatHours(from: string | undefined, to: string | undefined, t: (key: string) => string) {
  if (!from || !to) return t('resident.amenities.checkAvailability');
  const [fromH] = from.split(':').map(Number);
  const [toH] = to.split(':').map(Number);
  if (fromH === 0 && toH >= 23) return t('resident.amenities.twentyFourSeven');
  return `${fromH % 12 || 12} ${fromH >= 12 ? 'PM' : 'AM'}–${toH % 12 || 12} ${toH >= 12 ? 'PM' : 'AM'}`;
}

export function AmenityCard({ amenity, hero, compact, onPress, onBookingsPress }: Props) {
  const { t } = useTranslation();
  const free = (amenity.hourly_price ?? 0) === 0 && (amenity.daily_price ?? 0) === 0;
  const priceLabel = free
    ? t('common.free')
    : t('common.perHour', { price: formatMoney(amenity.hourly_price ?? amenity.daily_price) });
  const hoursLabel = formatHours(amenity.available_from, amenity.available_to, t);

  const content = (
    <>
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
            {hoursLabel}
          </Text>
        )}

        {!compact && (
          <>
            <Text variant="footnote" color="textSecondary" numberOfLines={2}>
              {amenity.description ?? amenity.rules_text ?? t('resident.amenities.availableForResidents')}
            </Text>
            <View className="flex-row items-center justify-between gap-sm">
              <View className="flex-row items-center gap-xs">
                <View className="h-2 w-2 rounded-pill bg-success" />
                <Text variant="caption" color="textSecondary">
                  {hoursLabel}
                </Text>
              </View>
              {hero && (
                <View className="flex-row items-center gap-xs">
                  <Text variant="subhead" color="coral">
                    {t('common.bookNow')}
                  </Text>
                  <IconSymbol name="arrow_forward" size={16} color="coral" />
                </View>
              )}
            </View>
          </>
        )}
      </View>
    </>
  );

  if (onBookingsPress) {
    return (
      <Card className={`gap-sm${hero ? '' : ' flex-1'}`} padding={hero ? 'none' : 'base'}>
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={t('a11y.amenity', { name: amenity.name })}
        >
          {content}
        </Pressable>
        <View className={hero ? 'px-base pb-base' : ''}>
          <Button
            label={t('nav.screens.bookings')}
            variant="tonal"
            icon="calendar_today"
            onPress={onBookingsPress}
          />
        </View>
      </Card>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('a11y.amenity', { name: amenity.name })}
    >
      <Card className={`gap-sm${hero ? '' : ' flex-1'}`} padding={hero ? 'none' : 'base'}>
        {content}
      </Card>
    </Pressable>
  );
}
