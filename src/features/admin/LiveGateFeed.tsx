import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card, EmptyState, StatusPill, Text } from '@/components';
import { formatDateTime, titleize } from '@/lib/format';
import type { Tables } from '@/types/database';

const tone: Record<Tables<'visitors'>['status'], 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  approved: 'success',
  entered: 'info',
  exited: 'neutral',
  expired: 'neutral',
  pending: 'warning',
  rejected: 'danger',
};

interface Props {
  visitors: Tables<'visitors'>[];
}

export function LiveGateFeed({ visitors }: Props) {
  const { t } = useTranslation();

  if (!visitors.length) {
    return (
      <EmptyState
        icon="qr_code"
        title={t('admin.dashboard.noGateActivity')}
        subtitle={t('admin.dashboard.noGateActivitySub')}
      />
    );
  }

  return (
    <View className="gap-md">
      {visitors.map((visitor) => (
        <Card key={visitor.id} variant="outlined" className="gap-sm">
          <View className="flex-row items-start justify-between gap-md">
            <View className="flex-1">
              <Text variant="headline">{visitor.visitor_name}</Text>
              <Text variant="footnote" color="textSecondary">
                {titleize(visitor.type)} - {formatDateTime(visitor.requested_at)}
              </Text>
            </View>
            <StatusPill tone={tone[visitor.status]} label={titleize(visitor.status)} />
          </View>
          <Text variant="body" color="textSecondary">
            {visitor.purpose ?? t('format.notSet')}
          </Text>
        </Card>
      ))}
    </View>
  );
}
