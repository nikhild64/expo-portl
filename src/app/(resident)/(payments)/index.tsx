import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { Screen, ScreenEmpty, Text } from '@/components';
import { DuesBreakdown } from '@/features/payments/DuesBreakdown';
import { DuesHero } from '@/features/payments/DuesHero';
import { PastPayments } from '@/features/payments/PastPayments';
import { useQueryRefresh } from '@/queries/useNotificationPreferences';
import { useDuesCurrent, useDuesHistory, usePendingPayments } from '@/queries/useDues';
import { useMyFlatIds } from '@/queries/useMe';

const MAX_POLL_ITERATIONS = 24;

export default function PaymentsScreen() {
  const queryClient = useQueryClient();
  const pollCount = useRef(0);
  const [pollExhausted, setPollExhausted] = useState(false);
  const { data: flatIds, isLoading: flatLoading } = useMyFlatIds();
  const { data: currentDue, isLoading: dueLoading } = useDuesCurrent(flatIds);
  const { data: history = [] } = useDuesHistory(flatIds);
  const { data: pendingPayments = [] } = usePendingPayments();
  const { refreshing, refresh } = useQueryRefresh([['dues'], ['notifications']]);

  useEffect(() => {
    if (!pendingPayments.length) {
      pollCount.current = 0;
      setPollExhausted(false);
      return;
    }
    if (pollExhausted) return;

    const interval = setInterval(() => {
      pollCount.current += 1;
      if (pollCount.current >= MAX_POLL_ITERATIONS) {
        setPollExhausted(true);
        clearInterval(interval);
        return;
      }
      void queryClient.invalidateQueries({ queryKey: ['dues'] });
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }, 5_000);

    return () => clearInterval(interval);
  }, [pendingPayments.length, pollExhausted, queryClient]);

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
    <Screen scroll safe={false} refreshing={refreshing} onRefresh={refresh} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      {pollExhausted && pendingPayments.length > 0 && (
        <Text variant="footnote" color="textSecondary">
          Still processing — pull to refresh
        </Text>
      )}
      <DuesHero due={currentDue} />
      <DuesBreakdown due={currentDue} />
      <PastPayments dues={history} pendingPayments={pendingPayments} />
    </Screen>
  );
}
