import { useEffect, useRef } from 'react';
import { ScrollView } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { Screen, ScreenEmpty, ScreenLoading, Text } from '@/components';
import { DuesBreakdown } from '@/features/payments/DuesBreakdown';
import { DuesOutstandingList } from '@/features/payments/DuesOutstandingList';
import { PastPayments } from '@/features/payments/PastPayments';
import { invalidatePaymentQueries } from '@/features/payments/duesPayment';
import { useQueryRefresh } from '@/hooks/useQueryRefresh';
import { useCancelledAmenityBookings } from '@/queries/useAmenityBookings';
import { useDuesHistory, useDuesOutstanding, useCapturedAmenityPayments, useFailedPayments, usePendingPayments } from '@/queries/useDues';
import { useMyFlatIds } from '@/queries/useMe';

export default function PaymentsScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const prevPendingCount = useRef(0);
  const scrollRef = useRef<ScrollView>(null);
  const { data: flatIds, isLoading: flatLoading } = useMyFlatIds();
  const { data: outstandingDues = [], isLoading: dueLoading } = useDuesOutstanding(flatIds);
  const { data: history = [] } = useDuesHistory(flatIds);
  const { data: pendingPayments = [] } = usePendingPayments();
  const { data: failedPayments = [] } = useFailedPayments();
  const { data: capturedAmenityPayments = [] } = useCapturedAmenityPayments();
  const { data: cancelledBookings = [] } = useCancelledAmenityBookings();
  const { refreshing, refresh } = useQueryRefresh([
    ['dues'],
    ['notifications'],
    ['payments', 'pending'],
    ['payments', 'failed'],
    ['payments', 'captured-amenity'],
    ['amenity-bookings', 'cancelled'],
  ]);

  useEffect(() => {
    const pendingCount = pendingPayments.length;
    if (prevPendingCount.current > 0 && pendingCount === 0) {
      void invalidatePaymentQueries(queryClient, 'dues');
      void invalidatePaymentQueries(queryClient, 'amenity');
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
    prevPendingCount.current = pendingCount;
  }, [pendingPayments.length, queryClient]);

  if (flatLoading || dueLoading) return <ScreenLoading variant="tab" />;

  if (flatIds && !flatIds.length) {
    return (
      <ScreenEmpty
        variant="tab"
        icon="apartment"
        title={t('status.notLinked')}
        subtitle={t('resident.payments.noFlatLinkedSub')}
      />
    );
  }

  return (
    <Screen scroll ref={scrollRef} variant="tab" refreshing={refreshing} onRefresh={refresh}>
      <DuesOutstandingList
        dues={outstandingDues}
        pendingPayments={pendingPayments}
        failedPayments={failedPayments}
      />
      <DuesBreakdown dues={outstandingDues} />
      <PastPayments
        dues={history}
        pendingPayments={pendingPayments}
        failedPayments={failedPayments}
        capturedAmenityPayments={capturedAmenityPayments}
        cancelledBookings={cancelledBookings}
      />
    </Screen>
  );
}
