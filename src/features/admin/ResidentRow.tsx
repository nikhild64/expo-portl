import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card, StatusPill, Text } from '@/components';
import i18n from '@/i18n';
import { formatFlatLabel } from '@/lib/format';
import { createStatusDisplay } from '@/lib/statusDisplay';
import type { ResidentWithFlats } from '@/queries/useAdminResidents';

const residentStatus = createStatusDisplay<ResidentWithFlats['status']>({
  active: { label: () => i18n.t('status.active'), tone: 'success' },
  blocked: { label: () => i18n.t('status.blocked'), tone: 'danger' },
  pending: { label: () => i18n.t('status.pending'), tone: 'warning' },
});
interface Props {
  resident: ResidentWithFlats;
  onPress?: () => void;
}

export const ResidentRow = memo(function ResidentRow({ resident, onPress }: Props) {
  const { t } = useTranslation();
  const flatLabel = resident.flat_residents
    ?.map((link) => formatFlatLabel(link.flats?.towers?.name, link.flats?.number, link.flat_id.slice(0, 4)))
    .join(', ');

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={resident.full_name ?? t('nav.screens.resident')}>
      <Card variant="outlined" className="gap-sm">
        <View className="flex-row items-start justify-between gap-md">
          <View className="flex-1">
            <Text variant="headline">{resident.full_name}</Text>
            <Text variant="footnote" color="textSecondary">
              {resident.phone ?? t('format.phoneNotShared')}
              {flatLabel ? ` - ${flatLabel}` : ''}
            </Text>
          </View>
          <StatusPill tone={residentStatus.tone(resident.status)} label={residentStatus.label(resident.status)} />
        </View>
      </Card>
    </Pressable>
  );
});
