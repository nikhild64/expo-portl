import { View } from 'react-native';

import { Card, IconSymbol, StatusPill, Text } from '@/components';
import { formatDate, formatMoney } from '@/lib/format';
import type { Tables } from '@/types/database';

interface Props {
  dues: Tables<'dues'>[];
}

export function PastPayments({ dues }: Props) {
  return (
    <View className="gap-sm">
      <Text variant="caption" color="textSecondary">
        PAST PAYMENTS
      </Text>
      <Card padding="none" className="overflow-hidden">
        {dues.length ? (
          dues.map((due) => (
            <View key={due.id} className="flex-row items-center gap-md px-base py-md bg-surface">
              <IconSymbol name="credit_card" color="coral" />
              <View className="flex-1">
                <Text variant="headline">{due.period}</Text>
                <Text variant="footnote" color="textSecondary">
                  Paid {formatDate(due.paid_at)}
                </Text>
              </View>
              <View className="items-end gap-xs">
                <Text variant="headline">{formatMoney(due.total)}</Text>
                <StatusPill tone="success" label="Paid" />
              </View>
            </View>
          ))
        ) : (
          <View className="p-base">
            <Text variant="body" color="textSecondary">
              No paid dues yet.
            </Text>
          </View>
        )}
      </Card>
    </View>
  );
}
