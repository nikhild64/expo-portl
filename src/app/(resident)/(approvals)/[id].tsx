import { useLocalSearchParams } from 'expo-router';

import { ScreenEmpty, ScreenLoading } from '@/components';
import { ApprovalSheet } from '@/features/visitors/ApprovalSheet';
import { useVisitor } from '@/queries/useVisitors';

export default function ApprovalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: visitor, isLoading, error } = useVisitor(id);

  if (isLoading) return <ScreenLoading safe={false} />;

  if (error || !visitor) {
    return (
      <ScreenEmpty
        safe={false}
        icon="error_outline"
        title="Visitor not found"
        subtitle="This request may have expired or been removed."
      />
    );
  }

  return <ApprovalSheet visitor={visitor} />;
}
