import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card, EmptyState, StatusPill, Text } from '@/components';
import { visitorStatusLabel, visitorStatusTone } from '@/features/visitors/visitorStatus';
import { formatDateTime, titleize } from '@/lib/format';
import type { Tables } from '@/types/database';

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
            <StatusPill tone={visitorStatusTone(visitor.status)} label={visitorStatusLabel(visitor.status)} />
          </View>
          <Text variant="body" color="textSecondary">
            {visitor.purpose ?? t('format.notSet')}
          </Text>
        </Card>
      ))}
    </View>
  );
}
