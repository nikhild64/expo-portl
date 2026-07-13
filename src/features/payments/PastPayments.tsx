import { View } from 'react-native';

import { Card, IconSymbol, StatusPill, Text } from '@/components';
import { formatDate, formatMoney } from '@/lib/format';
import type { PendingPayment } from '@/queries/useDues';
import type { Tables } from '@/types/database';

interface Props {
  dues: Tables<'dues'>[];
  pendingPayments?: PendingPayment[];
}

export function PastPayments({ dues, pendingPayments = [] }: Props) {
  return (
    <View className="gap-lg">
      {pendingPayments.length > 0 && (
        <View className="gap-sm">
          <Text variant="caption" color="textSecondary">
            PROCESSING
          </Text>
          <Card padding="none" className="overflow-hidden">
            {pendingPayments.map((payment) => (
              <View key={payment.id} className="flex-row items-center gap-md px-base py-md bg-surface">
                <IconSymbol name="schedule" color="warning" />
                <View className="flex-1">
                  <Text variant="headline">{payment.label}</Text>
                  <Text variant="footnote" color="textSecondary">
                    Submitted {formatDate(payment.created_at)}
                  </Text>
                </View>
                <View className="items-end gap-xs">
                  <Text variant="headline">{formatMoney(payment.amount)}</Text>
                  <StatusPill tone="warning" label="Processing" />
                </View>
              </View>
            ))}
          </Card>
        </View>
      )}

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
                {pendingPayments.length ? 'Confirmed payments will appear here once verified.' : 'No paid dues yet.'}
              </Text>
            </View>
          )}
        </Card>
      </View>
    </View>
  );
}
