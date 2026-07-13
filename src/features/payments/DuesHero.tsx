import { View } from 'react-native';
import { alert } from '@/lib/alert';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
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
        <StatusPill tone="success" label={t('resident.payments.clear')} icon="check_circle" />
        <Text variant="titleLarge">{t('resident.payments.noCurrentDues')}</Text>
        <Text variant="body" color="textSecondary">
          {t('resident.payments.allCaughtUp')}
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
      alert(
        t('alert.titles.paymentFailed'),
        error instanceof Error ? error.message : t('common.pleaseTryAgain'),
      );
    } finally {
      setPaying(false);
    }
  };

  if (pendingPayment) {
    return (
      <Card className="gap-lg overflow-hidden">
        <HeroBackground />
        <View className="flex-row items-center justify-between">
          <StatusPill tone="warning" label={t('resident.payments.processing')} icon="schedule" />
          <Text variant="caption" color="textSecondary">
            {t('resident.payments.submitted', { date: formatDate(pendingPayment.created_at) })}
          </Text>
        </View>
        <View>
          <Text variant="caption" color="coral">
            {t('resident.payments.paymentInProgress')}
          </Text>
          <Text variant="display">{formatMoney(pendingPayment.amount)}</Text>
          <Text variant="footnote" color="textSecondary">
            {t('resident.payments.razorpayVerifying')}
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
          <StatusPill tone="danger" label={t('resident.payments.paymentFailed')} icon="error_outline" />
          <Text variant="caption" color="textSecondary">
            {formatDate(failedPayment.created_at)}
          </Text>
        </View>
        <View className="gap-xs">
          <Text variant="caption" color="coral">
            {t('resident.payments.amountDue')}
          </Text>
          <Text variant="display">{formatMoney(due.total)}</Text>
          <Text variant="body">{t('common.forPeriod', { period: formatDuesPeriod(due.period) })}</Text>
          <Text variant="footnote" color="error">
            {t('resident.payments.lastPaymentFailed')}
          </Text>
        </View>
        <Button label={t('resident.payments.payAmount', { amount: formatMoney(due.total) })} icon="lock" loading={paying} onPress={pay} />
        {onViewBreakdown && (
          <Button
            label={t('resident.payments.viewBreakdown')}
            variant="text"
            icon="arrow_forward"
            iconPosition="right"
            onPress={onViewBreakdown}
          />
        )}
      </Card>
    );
  }

  const dueLabel =
    days >= 0
      ? t('resident.payments.dueInDays', { count: days })
      : t('resident.payments.daysOverdue', { count: Math.abs(days) });

  return (
    <Card className="gap-lg overflow-hidden">
      <HeroBackground />
      <View>
        <Text variant="caption" color="coral">
          {t('resident.payments.amountDue')}
        </Text>
        <Text variant="display">{formatMoney(due.total)}</Text>
        <Text variant="body">{t('common.forPeriod', { period: formatDuesPeriod(due.period) })}</Text>
      </View>
      <StatusPill
        tone={due.status === 'overdue' ? 'danger' : 'warning'}
        label={dueLabel}
        icon="schedule"
      />
      <Button label={t('resident.payments.payAmount', { amount: formatMoney(due.total) })} icon="lock" loading={paying} onPress={pay} />
      {onViewBreakdown && (
        <Button
          label={t('resident.payments.viewBreakdown')}
          variant="text"
          icon="arrow_forward"
          iconPosition="right"
          onPress={onViewBreakdown}
        />
      )}
    </Card>
  );
}
