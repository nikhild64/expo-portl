import { EmptyState, Screen } from '@/components';
import { DuesBreakdown } from '@/features/payments/DuesBreakdown';
import { DuesHero } from '@/features/payments/DuesHero';
import { PastPayments } from '@/features/payments/PastPayments';
import { useDuesCurrent, useDuesHistory } from '@/queries/useDues';
import { useMyFlatIds } from '@/queries/useMe';

export default function PaymentsScreen() {
  const { data: flatIds } = useMyFlatIds();
  const { data: currentDue } = useDuesCurrent(flatIds);
  const { data: history = [] } = useDuesHistory(flatIds);

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
