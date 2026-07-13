import { Alert, View } from 'react-native';
import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Button, Card, StatusPill, Text } from '@/components';
import { formatDate, formatDuesPeriod, formatMoney } from '@/lib/format';
import { createOrder, openCheckout } from '@/lib/razorpay';
import { useThemeColors } from '@/theme/useThemeColors';
import type { LabeledPayment } from '@/queries/useDues';
import { useAuthStore } from '@/stores/authStore';
import type { Tables } from '@/types/database';

interface Props {
  dues: Tables<'dues'>[];
  pendingPayments?: LabeledPayment[];
  failedPayments?: LabeledPayment[];
}

function HeroBackground() {
  const { surface, surfaceSecondary, coralLight } = useThemeColors();

  return (
    <View className="absolute inset-0" pointerEvents="none">
      <Svg width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="duesHeroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={surfaceSecondary} />
            <Stop offset="55%" stopColor={surface} />
            <Stop offset="100%" stopColor={surface} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#duesHeroGradient)" />
        <Circle cx="92%" cy="12%" r="36" fill={coralLight} opacity={0.45} />
        <Circle cx="98%" cy="6%" r="22" fill={coralLight} opacity={0.3} />
        <Circle cx="84%" cy="4%" r="14" fill={coralLight} opacity={0.25} />
      </Svg>
    </View>
  );
}

function dueDaysLabel(due: Tables<'dues'>) {
  const days = Math.ceil((new Date(due.due_date).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  if (days >= 0) return `Due in ${days} day${days === 1 ? '' : 's'}`;
  return `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`;
}

export function DuesOutstandingList({ dues, pendingPayments = [], failedPayments = [] }: Props) {
  const queryClient = useQueryClient();
  const profile = useAuthStore((s) => s.profile);
  const email = useAuthStore((s) => s.session?.user.email);
  const [payingId, setPayingId] = useState<string | null>(null);

  const pendingByDueId = useMemo(() => {
    const map = new Map<string, LabeledPayment>();
    for (const payment of pendingPayments) {
      if (payment.purpose === 'dues' && payment.reference_id) {
        map.set(payment.reference_id, payment);
      }
      for (const dueId of payment.reference_ids ?? []) {
        map.set(dueId, payment);
      }
    }
    return map;
  }, [pendingPayments]);

  const failedByDueId = useMemo(() => {
    const map = new Map<string, LabeledPayment>();
    for (const payment of failedPayments) {
      if (payment.purpose === 'dues' && payment.reference_id) {
        map.set(payment.reference_id, payment);
      }
      for (const dueId of payment.reference_ids ?? []) {
        map.set(dueId, payment);
      }
    }
    return map;
  }, [failedPayments]);

  const payableDues = useMemo(
    () => dues.filter((due) => !pendingByDueId.has(due.id)),
    [dues, pendingByDueId],
  );

  const payTotal = useMemo(
    () => payableDues.reduce((sum, due) => sum + Number(due.total), 0),
    [payableDues],
  );

  const invalidatePayments = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['dues'] }),
      queryClient.invalidateQueries({ queryKey: ['payments', 'pending'] }),
      queryClient.invalidateQueries({ queryKey: ['payments', 'failed'] }),
    ]);
  };

  const payDues = async (selected: Tables<'dues'>[]) => {
    if (!profile || !selected.length) return;

    const amount = selected.reduce((sum, due) => sum + Number(due.total), 0);
    const referenceIds = selected.map((due) => due.id);
    const payingKey = selected.length === 1 ? selected[0].id : 'all';
    setPayingId(payingKey);

    try {
      const { orderId, keyId } = await createOrder({
        amount,
        purpose: 'dues',
        referenceIds,
        referenceId: referenceIds[0],
      });
      await openCheckout({
        amount,
        keyId,
        notes: {
          purpose: 'dues',
          referenceId: referenceIds[0],
          referenceIds: referenceIds.join(','),
        },
        orderId,
        prefill: { contact: profile.phone ?? undefined, email: email ?? '', name: profile.full_name },
      });
      await invalidatePayments();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Payment failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setPayingId(null);
    }
  };

  if (!dues.length) {
    return (
      <Card className="gap-sm overflow-hidden">
        <HeroBackground />
        <StatusPill tone="success" label="Clear" icon="check_circle" />
        <Text variant="titleLarge">No current dues</Text>
        <Text variant="body" color="textSecondary">
          You are all caught up.
        </Text>
      </Card>
    );
  }

  return (
    <View className="gap-md">
      <Card className="gap-lg overflow-hidden">
        <HeroBackground />
        <View>
          <Text variant="caption" color="coral">
            {dues.length === 1 ? 'AMOUNT DUE' : 'TOTAL OUTSTANDING'}
          </Text>
          <Text variant="display">{formatMoney(dues.reduce((sum, due) => sum + Number(due.total), 0))}</Text>
          <Text variant="body" color="textSecondary">
            {dues.length === 1 ? `For ${formatDuesPeriod(dues[0].period)}` : `${dues.length} months outstanding`}
          </Text>
        </View>
        {payableDues.length > 1 ? (
          <Button
            label={`Pay all ${formatMoney(payTotal)}`}
            icon="lock"
            loading={payingId === 'all'}
            disabled={!!payingId && payingId !== 'all'}
            onPress={() => payDues(payableDues)}
            full
          />
        ) : null}
      </Card>

      <View className="gap-sm">
        <Text variant="caption" color="textSecondary">
          OUTSTANDING DUES
        </Text>
        {dues.map((due) => {
          const pendingPayment = pendingByDueId.get(due.id);
          const failedPayment = failedByDueId.get(due.id);
          const isPaying = payingId === due.id;

          return (
            <Card key={due.id} variant="outlined" className="gap-md">
              <View className="flex-row items-start justify-between gap-md">
                <View className="flex-1 gap-xs">
                  <Text variant="headline">{formatDuesPeriod(due.period)}</Text>
                  <Text variant="footnote" color="textSecondary">
                    Due {formatDate(due.due_date)}
                  </Text>
                </View>
                <Text variant="headline">{formatMoney(due.total)}</Text>
              </View>

              {pendingPayment ? (
                <View className="gap-xs">
                  <StatusPill tone="warning" label="Processing" icon="schedule" />
                  <Text variant="footnote" color="textSecondary">
                    Submitted {formatDate(pendingPayment.created_at)} — Razorpay is verifying this payment.
                  </Text>
                </View>
              ) : failedPayment ? (
                <View className="gap-sm">
                  <StatusPill tone="danger" label="Payment failed" icon="error_outline" />
                  <Text variant="footnote" color="error">
                    Your last attempt did not go through.
                  </Text>
                  <Button
                    label={`Pay ${formatMoney(due.total)}`}
                    icon="lock"
                    size="sm"
                    loading={isPaying}
                    disabled={!!payingId && payingId !== due.id}
                    onPress={() => payDues([due])}
                  />
                </View>
              ) : (
                <View className="gap-sm">
                  <StatusPill
                    tone={due.status === 'overdue' ? 'danger' : 'warning'}
                    label={dueDaysLabel(due)}
                    icon="schedule"
                  />
                  {payableDues.length > 1 ? (
                    <Button
                      label={`Pay ${formatMoney(due.total)}`}
                      variant="outlined"
                      size="sm"
                      loading={isPaying}
                      disabled={!!payingId && payingId !== due.id}
                      onPress={() => payDues([due])}
                    />
                  ) : (
                    <Button
                      label={`Pay ${formatMoney(due.total)}`}
                      icon="lock"
                      loading={isPaying}
                      disabled={!!payingId}
                      onPress={() => payDues([due])}
                      full
                    />
                  )}
                </View>
              )}
            </Card>
          );
        })}
      </View>
    </View>
  );
}
