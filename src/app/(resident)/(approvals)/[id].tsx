import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ScreenEmpty, ScreenLoading } from '@/components';
import { ApprovalSheet } from '@/features/visitors/ApprovalSheet';
import { useVisitor } from '@/queries/useVisitors';

export default function ApprovalDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: visitor, isLoading, error } = useVisitor(id);

  if (isLoading) return <ScreenLoading safe={false} />;

  if (error || !visitor) {
    return (
      <ScreenEmpty
        safe={false}
        icon="error_outline"
        title={t('resident.approval.visitorNotFound')}
        subtitle={t('resident.approval.visitorNotFoundSub')}
      />
    );
  }

  return <ApprovalSheet visitor={visitor} />;
}
