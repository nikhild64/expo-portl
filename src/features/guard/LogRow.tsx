import { memo } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Avatar, Button, StatusPill, Text } from '@/components';
import { visitorGateStatus } from '@/features/visitors/visitorStatus';
import { formatDateTime, formatFlatLabel, titleize } from '@/lib/format';
import { VISITOR_PHOTOS_BUCKET } from '@/lib/storage';
import type { VisitorLogRow } from '@/queries/useVisitorLog';

interface Props {
  imageUri?: string;
  loading?: boolean;
  onMarkExit: (visitorId: string) => void;
  visitor: VisitorLogRow;
}

export const LogRow = memo(function LogRow({ imageUri, loading, onMarkExit, visitor }: Props) {
  const { t } = useTranslation();
  const stillInside = !!visitor.entered_at && !visitor.exited_at;
  const flatLabel = formatFlatLabel(visitor.flats?.towers?.name, visitor.flats?.number);
  const status = visitorGateStatus(visitor, { uppercase: true });

  return (
    <View className="flex-row gap-md border-b border-border bg-surface px-base py-md">
      <Avatar
        imageUri={imageUri}
        name={visitor.visitor_name}
        storageBucket={imageUri ? undefined : VISITOR_PHOTOS_BUCKET}
        uri={imageUri ? undefined : visitor.visitor_photo_path}
      />
      <View className="flex-1 gap-xs">
        <View className="flex-row items-start justify-between gap-sm">
          <View className="flex-1">
            <Text variant="headline">{visitor.visitor_name}</Text>
            <Text variant="footnote" color="textSecondary">
              {titleize(visitor.type)} · {flatLabel}
            </Text>
          </View>
          <StatusPill tone={status.tone} label={status.label} />
        </View>

        <Text variant="caption" color="textTertiary">
          {t('status.in')}: {formatDateTime(visitor.entered_at)} · {t('status.out')}: {formatDateTime(visitor.exited_at)}
        </Text>

        {stillInside && (
          <Button label={t('guard.log.markExit')} size="sm" variant="outlined" loading={loading} onPress={() => onMarkExit(visitor.id)} />
        )}
      </View>
    </View>
  );
});
