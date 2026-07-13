import { ActivityIndicator, View } from 'react-native';

import { EmptyState, Screen } from '@/components';
import { DuesBreakdown } from '@/features/payments/DuesBreakdown';
import { DuesHero } from '@/features/payments/DuesHero';
import { PastPayments } from '@/features/payments/PastPayments';
import { useDuesCurrent, useDuesHistory } from '@/queries/useDues';
import { useMyFlatIds } from '@/queries/useMe';

export default function PaymentsScreen() {
  const { data: flatIds, isLoading: flatLoading } = useMyFlatIds();
  const { data: currentDue, isLoading: dueLoading } = useDuesCurrent(flatIds);
  const { data: history = [] } = useDuesHistory(flatIds);

  if (flatLoading || dueLoading) {
    return (
      <Screen safe={false}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#F97066" />
        </View>
      </Screen>
    );
  }

  if (flatIds && !flatIds.length) {
    return <EmptyState icon="apartment" title="No flat linked" subtitle="Payments appear after your resident flat is linked." />;
  }

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <DuesHero due={currentDue} />
      <DuesBreakdown due={currentDue} />
      <PastPayments dues={history} />
    </Screen>
  );
}
