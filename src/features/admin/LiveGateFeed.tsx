import { View } from 'react-native';

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
  if (!visitors.length) {
    return <EmptyState icon="qr_code" title="No gate activity" subtitle="New visitor entries will appear here in real time." />;
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
            {visitor.purpose ?? 'No purpose provided'}
          </Text>
        </Card>
      ))}
    </View>
  );
}
