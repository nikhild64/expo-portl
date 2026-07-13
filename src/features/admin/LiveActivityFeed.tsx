import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card, EmptyState, IconSymbol, Text } from '@/components';
import { formatDateTime, titleize } from '@/lib/format';
import type { AdminActivityItem } from '@/queries/useAdminDashboard';

const iconForType: Record<AdminActivityItem['type'], 'qr_code' | 'construction' | 'calendar_today' | 'campaign'> = {
  booking: 'calendar_today',
  complaint: 'construction',
  notice: 'campaign',
  visitor: 'qr_code',
};

interface Props {
  items: AdminActivityItem[];
}

export function LiveActivityFeed({ items }: Props) {
  const { t } = useTranslation();

  if (!items.length) {
    return (
      <EmptyState
        icon="history"
        title={t('admin.dashboard.noRecentActivity')}
        subtitle={t('admin.dashboard.noRecentActivitySub')}
      />
    );
  }

  return (
    <Card className="gap-md">
      <Text variant="headline">{t('admin.dashboard.liveActivity')}</Text>
      {items.map((item) => (
        <View key={`${item.type}-${item.id}`} className="flex-row items-start gap-md">
          <View className="rounded-pill bg-surface-secondary p-sm">
            <IconSymbol name={iconForType[item.type]} size={18} color="coral" />
          </View>
          <View className="flex-1">
            <Text variant="body" numberOfLines={1}>
              {item.title}
            </Text>
            <Text variant="footnote" color="textSecondary">
              {titleize(item.subtitle)} - {formatDateTime(item.createdAt)}
            </Text>
          </View>
        </View>
      ))}
    </Card>
  );
}
