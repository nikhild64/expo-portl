import { memo, useMemo, useRef } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Avatar, Card, EmptyState, StatusPill, Text } from '@/components';
import { GuardActivitySheet, type GuardActivitySheetHandle } from '@/features/guard/GuardActivitySheet';
import { visitorGateStatus } from '@/features/visitors/visitorStatus';
import { formatDateTime, formatFlatLabel, titleize } from '@/lib/format';
import { signedUrlForPath, useSignedUrlMap, VISITOR_PHOTOS_BUCKET } from '@/lib/storage';
import type { GuardActivityVisitor } from '@/queries/useGuardActivity';

interface Props {
  visitors?: GuardActivityVisitor[];
}

export const RecentActivityList = memo(function RecentActivityList({ visitors }: Props) {
  const { t } = useTranslation();
  const sheetRef = useRef<GuardActivitySheetHandle>(null);
  const signedUrlMap = useSignedUrlMap(
    VISITOR_PHOTOS_BUCKET,
    useMemo(() => (visitors ?? []).map((visitor) => visitor.visitor_photo_path), [visitors]),
  );

  if (!visitors?.length) {
    return (
      <EmptyState
        icon="history"
        title={t('guard.log.noGateActivity')}
        subtitle={t('guard.log.newEntriesAppear')}
      />
    );
  }

  return (
    <View className="gap-sm">
      <Text variant="caption" color="textSecondary">
        {t('guard.log.recentActivity')}
      </Text>
      <Card padding="none" className="overflow-hidden">
        {visitors.map((visitor, index) => {
          const status = visitorGateStatus(visitor, { uppercase: true });
          const flatLabel = formatFlatLabel(visitor.flats?.towers?.name, visitor.flats?.number);
          const time = visitor.exited_at ?? visitor.entered_at ?? visitor.requested_at;
          const imageUri = signedUrlForPath(signedUrlMap, visitor.visitor_photo_path, VISITOR_PHOTOS_BUCKET);

          return (
            <Pressable
              key={visitor.id}
              accessibilityRole="button"
              accessibilityLabel={visitor.visitor_name}
              onPress={() => sheetRef.current?.open(visitor)}
              className={`flex-row items-center gap-md px-base py-sm active:opacity-70${index > 0 ? ' border-t border-border' : ''}`}
            >
              <Avatar
                imageUri={imageUri}
                name={visitor.visitor_name}
                storageBucket={imageUri ? undefined : VISITOR_PHOTOS_BUCKET}
                uri={imageUri ? undefined : visitor.visitor_photo_path}
                size="md"
              />
              <View className="flex-1">
                <Text variant="headline">{visitor.visitor_name}</Text>
                <Text variant="caption" color="textSecondary">
                  {status.label === t('status.out').toUpperCase()
                    ? t('status.exited')
                    : status.label === t('status.in').toUpperCase()
                      ? t('status.entered')
                      : titleize(visitor.type)}{' '}
                  · {flatLabel} · {formatDateTime(time)}
                </Text>
              </View>
              <StatusPill tone={status.tone} label={status.label} />
            </Pressable>
          );
        })}
      </Card>
      <GuardActivitySheet ref={sheetRef} />
    </View>
  );
});
