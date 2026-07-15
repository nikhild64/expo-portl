import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { EmptyState, Screen, ScreenLoading, Text } from '@/components';
import { VisitorListItem } from '@/features/visitors/VisitorListItem';
import { formatDate } from '@/lib/format';
import { useMyFlatIds } from '@/queries/useMe';
import { useVisitorsList } from '@/queries/useVisitors';

export default function VisitorHistoryScreen() {
  const { t } = useTranslation();
  const { data: flatIds, isLoading: flatLoading } = useMyFlatIds();
  const { data: visitors = [], isLoading: visitorsLoading } = useVisitorsList(flatIds, 'history');

  if (flatLoading || visitorsLoading) return <ScreenLoading variant="tab" />;
  let lastDate = '';

  return (
    <Screen scroll variant="tab">
      {visitors.length ? (
        visitors.map((visitor) => {
          const date = formatDate(visitor.requested_at);
          const showHeader = date !== lastDate;
          lastDate = date;

          return (
            <View key={visitor.id} className="gap-sm">
              {showHeader && (
                <Text variant="caption" color="textSecondary">
                  {date}
                </Text>
              )}
              <VisitorListItem visitor={visitor} />
            </View>
          );
        })
      ) : (
        <EmptyState icon="history" title={t('resident.visitorHistory.noHistory')} subtitle={t('resident.visitorHistory.noHistorySub')} />
      )}
    </Screen>
  );
}
