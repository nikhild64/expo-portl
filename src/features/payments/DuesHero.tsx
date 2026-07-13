import { Alert, View } from 'react-native';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';

import { Button, Card, StatusPill, Text } from '@/components';
import { formatDate, formatMoney, titleize } from '@/lib/format';
import { createOrder, openCheckout } from '@/lib/razorpay';
import { usePendingPayments } from '@/queries/useDues';
import { useAuthStore } from '@/stores/authStore';
import type { Tables } from '@/types/database';

interface Props {
  due: Tables<'dues'> | null | undefined;
  onViewBreakdown?: () => void;
}

export function DuesHero({ due, onViewBreakdown }: Props) {
  const queryClient = useQueryClient();
  const profile = useAuthStore((s) => s.profile);
  const email = useAuthStore((s) => s.session?.user.email);
  const { data: pendingPayments = [] } = usePendingPayments();
  const [paying, setPaying] = useState(false);

  if (!due) {
    return (
      <Card className="gap-sm overflow-hidden">
        <View className="absolute -right-8 -top-8 h-28 w-28 rounded-pill bg-coral-light opacity-80" />
        <StatusPill tone="success" label="Clear" icon="check_circle" />
        <Text variant="titleLarge">No current dues</Text>
        <Text variant="body" color="textSecondary">
          You are all caught up.
        </Text>
      </Card>
    );
  }

  const days = Math.ceil((new Date(due.due_date).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  const pendingPayment = pendingPayments.find(
    (payment) => payment.purpose === 'dues' && payment.reference_id === due.id,
  );

  const pay = async () => {
    if (!profile || pendingPayment) return;
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
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['dues'] }),
        queryClient.invalidateQueries({ queryKey: ['payments', 'pending'] }),
      ]);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Payment failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setPaying(false);
    }
  };

  if (pendingPayment) {
    return (
      <Card className="gap-lg overflow-hidden">
        <View className="absolute -right-8 -top-8 h-28 w-28 rounded-pill bg-coral-light opacity-80" />
        <View className="flex-row items-center justify-between">
          <StatusPill tone="warning" label="Processing" icon="schedule" />
          <Text variant="caption" color="textSecondary">
            Submitted {formatDate(pendingPayment.created_at)}
          </Text>
        </View>
        <View>
          <Text variant="caption" color="textSecondary">
            PAYMENT IN PROGRESS
          </Text>
          <Text variant="display">{formatMoney(pendingPayment.amount)}</Text>
          <Text variant="footnote" color="textSecondary">
            Razorpay is verifying your payment. This usually takes a few seconds.
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <Card className="gap-lg overflow-hidden">
      <View className="absolute -right-8 -top-8 h-28 w-28 rounded-pill bg-coral-light opacity-80" />
      <View>
        <Text variant="caption" color="textSecondary">
          AMOUNT DUE
        </Text>
        <Text variant="display">{formatMoney(due.total)}</Text>
        <Text variant="footnote" color="textSecondary">
          For {due.period}
        </Text>
      </View>
      <StatusPill
        tone={due.status === 'overdue' ? 'danger' : 'warning'}
        label={days >= 0 ? `Due in ${days} day${days === 1 ? '' : 's'}` : `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`}
        icon="schedule"
      />
      <Button label={`Pay ${formatMoney(due.total)}`} icon="lock" loading={paying} onPress={pay} />
      {onViewBreakdown && (
        <Button label="View breakdown" variant="text" onPress={onViewBreakdown} />
      )}
      <Text variant="caption" color="textTertiary">
        Status: {titleize(due.status)} · Due {formatDate(due.due_date)}
      </Text>
    </Card>
  );
}
