import { View } from 'react-native';
import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { Button, Card, StatusPill, Text } from '@/components';
import { DuesHeroBackground } from '@/features/payments/DuesHeroBackground';
import { formatDueDaysLabel, payDuesCheckout } from '@/features/payments/duesPayment';
import { paymentStatusIcon, paymentStatusLabel, paymentStatusTone } from '@/features/payments/paymentStatus';
import { formatDate, formatDuesPeriod, formatMoney } from '@/lib/format';
import type { LabeledPayment } from '@/queries/useDues';
import { useAuthStore } from '@/stores/authStore';
import type { Tables } from '@/types/database';

interface Props {
  dues: Tables<'dues'>[];
  pendingPayments?: LabeledPayment[];
  failedPayments?: LabeledPayment[];
}

function indexDuesPaymentsByDueId(payments: LabeledPayment[]) {
  const map = new Map<string, LabeledPayment>();
  for (const payment of payments) {
    if (payment.purpose === 'dues' && payment.reference_id) {
      map.set(payment.reference_id, payment);
    }
    for (const dueId of payment.reference_ids ?? []) {
      map.set(dueId, payment);
    }
  }
  return map;
}

export function DuesOutstandingList({ dues, pendingPayments = [], failedPayments = [] }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const profile = useAuthStore((s) => s.profile);
  const email = useAuthStore((s) => s.session?.user.email);
  const [payingId, setPayingId] = useState<string | null>(null);

  const pendingByDueId = useMemo(() => indexDuesPaymentsByDueId(pendingPayments), [pendingPayments]);
  const failedByDueId = useMemo(() => indexDuesPaymentsByDueId(failedPayments), [failedPayments]);
  const payableDues = useMemo(
    () => dues.filter((due) => !pendingByDueId.has(due.id)),
    [dues, pendingByDueId],
  );
  const payTotal = useMemo(
    () => payableDues.reduce((sum, due) => sum + Number(due.total), 0),
    [payableDues],
  );

  const payDues = async (selected: Tables<'dues'>[]) => {
    if (!profile || !selected.length) return;

    const amount = selected.reduce((sum, due) => sum + Number(due.total), 0);
    const payingKey = selected.length === 1 ? selected[0].id : 'all';
    setPayingId(payingKey);

    await payDuesCheckout({
      amount,
      dues: selected,
      email,
      onFinally: () => setPayingId(null),
      profile,
      queryClient,
      t,
    });
  };

  if (!dues.length) {
    return (
      <Card className="gap-sm overflow-hidden">
        <DuesHeroBackground />
        <StatusPill
          tone={paymentStatusTone('clear')}
          label={paymentStatusLabel('clear')}
          icon={paymentStatusIcon('clear')}
        />
        <Text variant="titleLarge">{t('resident.payments.noCurrentDues')}</Text>
        <Text variant="body" color="textSecondary">
          {t('resident.payments.allCaughtUp')}
        </Text>
      </Card>
    );
  }

  return (
    <View className="gap-md">
      <Card className="gap-lg overflow-hidden">
        <DuesHeroBackground />
        <View>
          <Text variant="caption" color="coral">
            {dues.length === 1 ? t('resident.payments.amountDue') : t('resident.payments.totalOutstanding')}
          </Text>
          <Text variant="display">{formatMoney(dues.reduce((sum, due) => sum + Number(due.total), 0))}</Text>
          <Text variant="body" color="textSecondary">
            {dues.length === 1
              ? t('common.forPeriod', { period: formatDuesPeriod(dues[0].period) })
              : t('resident.payments.monthsOutstanding', { count: dues.length })}
          </Text>
        </View>
        {payableDues.length > 1 ? (
          <Button
            label={t('resident.payments.payAll', { amount: formatMoney(payTotal) })}
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
          {t('resident.payments.outstandingDues')}
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
                    {t('resident.payments.dueDate', { date: formatDate(due.due_date) })}
                  </Text>
                </View>
                <Text variant="headline">{formatMoney(due.total)}</Text>
              </View>

              {pendingPayment ? (
                <View className="gap-xs">
                  <StatusPill
                    tone={paymentStatusTone('processing')}
                    label={paymentStatusLabel('processing')}
                    icon={paymentStatusIcon('processing')}
                  />
                  <Text variant="footnote" color="textSecondary">
                    {t('resident.payments.submitted', { date: formatDate(pendingPayment.created_at) })}
                  </Text>
                </View>
              ) : failedPayment ? (
                <View className="gap-sm">
                  <StatusPill
                    tone={paymentStatusTone('failed')}
                    label={paymentStatusLabel('failed')}
                    icon={paymentStatusIcon('failed')}
                  />
                  <Text variant="footnote" color="error">
                    {t('resident.payments.lastAttemptFailed')}
                  </Text>
                  <Button
                    label={t('resident.payments.payAmount', { amount: formatMoney(due.total) })}
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
                    label={formatDueDaysLabel(due, t)}
                    icon="schedule"
                  />
                  {payableDues.length > 1 ? (
                    <Button
                      label={t('resident.payments.payAmount', { amount: formatMoney(due.total) })}
                      variant="outlined"
                      size="sm"
                      loading={isPaying}
                      disabled={!!payingId && payingId !== due.id}
                      onPress={() => payDues([due])}
                    />
                  ) : (
                    <Button
                      label={t('resident.payments.payAmount', { amount: formatMoney(due.total) })}
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
