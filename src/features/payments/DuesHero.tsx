import { Alert, View } from 'react-native';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Button, Card, StatusPill, Text } from '@/components';
import { formatDate, formatDuesPeriod, formatMoney } from '@/lib/format';
import { useThemeColors } from '@/theme/useThemeColors';
import { createOrder, openCheckout } from '@/lib/razorpay';
import { useFailedPayments, usePendingPayments } from '@/queries/useDues';
import { useAuthStore } from '@/stores/authStore';
import type { Tables } from '@/types/database';

interface Props {
  due: Tables<'dues'> | null | undefined;
  onViewBreakdown?: () => void;
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

export function DuesHero({ due, onViewBreakdown }: Props) {
  const queryClient = useQueryClient();
  const profile = useAuthStore((s) => s.profile);
  const email = useAuthStore((s) => s.session?.user.email);
  const { data: pendingPayments = [] } = usePendingPayments();
  const { data: failedPayments = [] } = useFailedPayments();
  const [paying, setPaying] = useState(false);

  if (!due) {
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

  const days = Math.ceil((new Date(due.due_date).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  const pendingPayment = pendingPayments.find(
    (payment) => payment.purpose === 'dues' && payment.reference_id === due.id,
  );
  const failedPayment = failedPayments.find(
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
        queryClient.invalidateQueries({ queryKey: ['payments', 'failed'] }),
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
        <HeroBackground />
        <View className="flex-row items-center justify-between">
          <StatusPill tone="warning" label="Processing" icon="schedule" />
          <Text variant="caption" color="textSecondary">
            Submitted {formatDate(pendingPayment.created_at)}
          </Text>
        </View>
        <View>
          <Text variant="caption" color="coral">
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

  if (failedPayment) {
    return (
      <Card className="gap-lg overflow-hidden">
        <HeroBackground />
        <View className="flex-row items-center justify-between">
          <StatusPill tone="danger" label="Payment failed" icon="error_outline" />
          <Text variant="caption" color="textSecondary">
            {formatDate(failedPayment.created_at)}
          </Text>
        </View>
        <View className="gap-xs">
          <Text variant="caption" color="coral">
            AMOUNT DUE
          </Text>
          <Text variant="display">{formatMoney(due.total)}</Text>
          <Text variant="body">For {formatDuesPeriod(due.period)}</Text>
          <Text variant="footnote" color="error">
            Your last payment did not go through. Try again when you are ready.
          </Text>
        </View>
        <Button label={`Pay ${formatMoney(due.total)}`} icon="lock" loading={paying} onPress={pay} />
        {onViewBreakdown && (
          <Button
            label="View breakdown"
            variant="text"
            icon="arrow_forward"
            iconPosition="right"
            onPress={onViewBreakdown}
          />
        )}
      </Card>
    );
  }

  return (
    <Card className="gap-lg overflow-hidden">
      <HeroBackground />
      <View>
        <Text variant="caption" color="coral">
          AMOUNT DUE
        </Text>
        <Text variant="display">{formatMoney(due.total)}</Text>
        <Text variant="body">For {formatDuesPeriod(due.period)}</Text>
      </View>
      <StatusPill
        tone={due.status === 'overdue' ? 'danger' : 'warning'}
        label={days >= 0 ? `Due in ${days} day${days === 1 ? '' : 's'}` : `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`}
        icon="schedule"
      />
      <Button label={`Pay ${formatMoney(due.total)}`} icon="lock" loading={paying} onPress={pay} />
      {onViewBreakdown && (
        <Button
          label="View breakdown"
          variant="text"
          icon="arrow_forward"
          iconPosition="right"
          onPress={onViewBreakdown}
        />
      )}
    </Card>
  );
}
