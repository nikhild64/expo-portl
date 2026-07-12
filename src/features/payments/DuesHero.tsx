import { Alert, View } from 'react-native';

import { Button, Card, StatusPill, Text } from '@/components';
import { formatDate, formatMoney, titleize } from '@/lib/format';
import type { Tables } from '@/types/database';

interface Props {
  due: Tables<'dues'> | null | undefined;
}

export function DuesHero({ due }: Props) {
  if (!due) {
    return (
      <Card className="gap-sm">
        <StatusPill tone="success" label="Clear" icon="check_circle" />
        <Text variant="titleLarge">No current dues</Text>
        <Text variant="body" color="textSecondary">
          You are all caught up.
        </Text>
      </Card>
    );
  }

  const days = Math.ceil((new Date(due.due_date).getTime() - Date.now()) / (24 * 60 * 60 * 1000));

  return (
    <Card className="gap-lg">
      <View className="flex-row items-center justify-between">
        <StatusPill tone={due.status === 'overdue' ? 'danger' : 'warning'} label={titleize(due.status)} />
        <Text variant="caption" color="textSecondary">
          Due {formatDate(due.due_date)}
        </Text>
      </View>
      <View>
        <Text variant="caption" color="textSecondary">
          CURRENT BALANCE
        </Text>
        <Text variant="display">{formatMoney(due.total)}</Text>
        <Text variant="footnote" color="textSecondary">
          {days >= 0 ? `Due in ${days} day${days === 1 ? '' : 's'}` : `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`}
        </Text>
      </View>
      <Button
        label={`Pay ${formatMoney(due.total)}`}
        disabled
        onPress={() => Alert.alert('Coming in M6', 'Razorpay checkout ships in the M6 phase.')}
      />
    </Card>
  );
}
