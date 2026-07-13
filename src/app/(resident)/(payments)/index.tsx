import { ActivityIndicator, View } from 'react-native';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { Screen, ScreenEmpty } from '@/components';
import { DuesBreakdown } from '@/features/payments/DuesBreakdown';
import { DuesHero } from '@/features/payments/DuesHero';
import { PastPayments } from '@/features/payments/PastPayments';
import { useDuesCurrent, useDuesHistory, usePendingPayments } from '@/queries/useDues';
import { useMyFlatIds } from '@/queries/useMe';

export default function PaymentsScreen() {
  const queryClient = useQueryClient();
  const { data: flatIds, isLoading: flatLoading } = useMyFlatIds();
  const { data: currentDue, isLoading: dueLoading } = useDuesCurrent(flatIds);
  const { data: history = [] } = useDuesHistory(flatIds);
  const { data: pendingPayments = [] } = usePendingPayments();

  useEffect(() => {
    if (!pendingPayments.length) return;
    const interval = setInterval(() => {
      void queryClient.invalidateQueries({ queryKey: ['dues'] });
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }, 5_000);
    return () => clearInterval(interval);
  }, [pendingPayments.length, queryClient]);

  if (flatLoading || dueLoading) {
    return (
      <Screen safe={false}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" colorClassName="accent-coral" />
        </View>
      </Screen>
    );
  }

  if (flatIds && !flatIds.length) {
    return <ScreenEmpty safe={false} icon="apartment" title="No flat linked" subtitle="Payments appear after your resident flat is linked." />;
  }

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <DuesHero due={currentDue} />
      <DuesBreakdown due={currentDue} />
      <PastPayments dues={history} pendingPayments={pendingPayments} />
    </Screen>
  );
}
