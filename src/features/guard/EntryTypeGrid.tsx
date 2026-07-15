import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Card, IconSymbol, Text, type IconName } from '@/components';
import type { Tables } from '@/types/database';

type VisitorType = Tables<'visitors'>['type'];

const entryTypeMeta: { key: 'guest' | 'delivery' | 'cab' | 'service'; value: VisitorType; icon: IconName }[] = [
  { key: 'guest', value: 'guest', icon: 'person' },
  { key: 'delivery', value: 'delivery', icon: 'local_shipping' },
  { key: 'cab', value: 'cab', icon: 'directions_car' },
  { key: 'service', value: 'service', icon: 'construction' },
];

interface Props {
  baseHref?: '/(guard)/(home)/new';
  compact?: boolean;
}

export function EntryTypeGrid({ baseHref, compact = false }: Props) {
  const { t } = useTranslation();

  return (
    <View className="gap-md">
      {!compact && (
        <Text variant="caption" color="textSecondary">
          {t('guard.add.addNewEntry')}
        </Text>
      )}
      <View className="flex-row flex-wrap gap-md">
        {entryTypeMeta.map((entry) => (
          <Pressable
            key={entry.value}
            className="min-w-[48%] flex-1"
            onPress={() => {
              if (!baseHref) return;
              router.push({ pathname: baseHref, params: { type: entry.value } });
            }}
            accessibilityRole="button"
            accessibilityLabel={t('guard.add.addNewEntry')}
            android_ripple={{ color: 'rgba(249,112,102,0.15)' }}
          >
            <Card variant="outlined" className="items-center gap-sm bg-surface-secondary" style={{ minHeight: 104 }}>
              <IconSymbol name={entry.icon} size={34} color="coral" />
              <Text variant="headline">{t(`guard.add.${entry.key}`)}</Text>
            </Card>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export { entryTypeMeta as entryTypes };
