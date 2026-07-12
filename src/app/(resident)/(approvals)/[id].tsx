import { useLocalSearchParams } from 'expo-router';

import { EmptyState, SkeletonCard } from '@/components';
import { ApprovalSheet } from '@/features/visitors/ApprovalSheet';
import { useVisitor } from '@/queries/useVisitors';

export default function ApprovalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: visitor, isLoading, error } = useVisitor(id);

  if (isLoading) return <SkeletonCard />;

  if (error || !visitor) {
    return <EmptyState icon="error_outline" title="Visitor not found" subtitle="This request may have expired or been removed." />;
  }

  return <ApprovalSheet visitor={visitor} />;
}
