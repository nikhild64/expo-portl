import { Alert, View } from 'react-native';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';

import { Button, Card, StatusPill, Text } from '@/components';
import { formatDate, formatMoney, titleize } from '@/lib/format';
import { createOrder, openCheckout } from '@/lib/razorpay';
import { useAuthStore } from '@/stores/authStore';
import type { Tables } from '@/types/database';

interface Props {
  due: Tables<'dues'> | null | undefined;
}

export function DuesHero({ due }: Props) {
  const queryClient = useQueryClient();
  const profile = useAuthStore((s) => s.profile);
  const email = useAuthStore((s) => s.session?.user.email);
  const [paying, setPaying] = useState(false);

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

  const pay = async () => {
    if (!profile) return;
    setPaying(true);
    try {
      const { orderId, keyId } = await createOrder({ amount: due.total, purpose: 'dues', referenceId: due.id });
      await openCheckout({
        amount: due.total,
        keyId,
        notes: { purpose: 'dues', referenceId: due.id },
        orderId,
        prefill: { contact: profile.phone ?? undefined, email: email ?? '', name: profile.full_name },
      });
      await queryClient.invalidateQueries({ queryKey: ['dues'] });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Payment processing', 'Your payment is being verified. Status will update shortly.');
    } catch (error) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Payment failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setPaying(false);
    }
  };

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
        loading={paying}
        onPress={pay}
      />
    </Card>
  );
}
