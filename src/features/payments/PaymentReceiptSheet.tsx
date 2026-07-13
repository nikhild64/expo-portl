import { useQuery } from '@tanstack/react-query';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useCSSVariable } from 'uniwind';
import { useTranslation } from 'react-i18next';

import { Button, Sheet, StatusPill, Text, type SheetHandle } from '@/components';
import { parseLineItems } from '@/features/payments/lineItems';
import { formatDate, formatDuesPeriod, formatMoney, titleize } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

export interface PaymentReceiptSheetHandle {
  open: (due: Tables<'dues'>) => void;
  close: () => void;
}

function ReceiptContent({ due }: { due: Tables<'dues'> }) {
  const { t } = useTranslation();
  const coral = useCSSVariable('--color-coral') as string;
  const items = parseLineItems(due.line_items);
  const { data: payment, isLoading } = useQuery({
    queryKey: ['payments', 'receipt', due.payment_id],
    enabled: !!due.payment_id,
    queryFn: async () => {
      const { data, error } = await supabase.from('payments').select('*').eq('id', due.payment_id!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return (
    <View className="gap-lg">
      <View className="items-center gap-xs">
        <StatusPill tone="success" label={t('resident.payments.paid')} icon="check_circle" align="center" />
        <Text variant="titleLarge">{formatDuesPeriod(due.period)}</Text>
        <Text variant="display">{formatMoney(due.total)}</Text>
        <Text variant="body" color="textSecondary">
          {t('resident.payments.paidOn', { date: formatDate(due.paid_at) })}
        </Text>
      </View>

      <View className="gap-sm rounded-lg border border-border bg-surface-secondary p-base">
        <Text variant="headline">{t('resident.payments.breakdown')}</Text>
        {items.length ? (
          items.map((item) => (
            <View key={item.label} className="flex-row justify-between gap-md">
              <Text variant="body" color="textSecondary">
                {titleize(item.label)}
              </Text>
              <Text variant="body">{formatMoney(item.amount)}</Text>
            </View>
          ))
        ) : (
          <Text variant="body" color="textSecondary">
            {t('resident.payments.noLineItemsRecorded')}
          </Text>
        )}
        <View className="flex-row justify-between border-t border-border pt-sm">
          <Text variant="headline">{t('common.total')}</Text>
          <Text variant="headline">{formatMoney(due.total)}</Text>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator color={coral} />
      ) : payment ? (
        <View className="gap-xs rounded-lg border border-border bg-surface-secondary p-base">
          <Text variant="caption" color="textSecondary">
            {t('resident.payments.paymentDetails')}
          </Text>
          {payment.razorpay_payment_id ? (
            <Text variant="footnote" color="textSecondary">
              {t('resident.payments.paymentId')} {payment.razorpay_payment_id}
            </Text>
          ) : null}
          <Text variant="footnote" color="textSecondary">
            {t('resident.payments.orderId')} {payment.order_id}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export const PaymentReceiptSheet = forwardRef<PaymentReceiptSheetHandle>(function PaymentReceiptSheet(_, ref) {
  const { t } = useTranslation();
  const sheetRef = useRef<SheetHandle>(null);
  const [due, setDue] = useState<Tables<'dues'> | null>(null);

  useImperativeHandle(ref, () => ({
    open: (nextDue) => {
      setDue(nextDue);
      setTimeout(() => sheetRef.current?.present(), 0);
    },
    close: () => sheetRef.current?.dismiss(),
  }));

  return (
    <Sheet ref={sheetRef} snapPoints={['75%', '92%']}>
      <View className="gap-md pb-lg">
        <Text variant="headline">{t('resident.payments.paymentReceipt')}</Text>
        {due ? <ReceiptContent due={due} /> : null}
        <Button label={t('common.close')} variant="tonal" full onPress={() => sheetRef.current?.dismiss()} />
      </View>
    </Sheet>
  );
});
