import { ActivityIndicator, View } from 'react-native';

import { EmptyState, Screen, Text } from '@/components';
import { VisitorListItem } from '@/features/visitors/VisitorListItem';
import { formatDate } from '@/lib/format';
import { useMyFlatIds } from '@/queries/useMe';
import { useVisitorsList } from '@/queries/useVisitors';

export default function VisitorHistoryScreen() {
  const { data: flatIds, isLoading: flatLoading } = useMyFlatIds();
  const { data: visitors = [], isLoading: visitorsLoading } = useVisitorsList(flatIds, 'history');

  if (flatLoading || visitorsLoading) {
    return (
      <Screen safe={false}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" colorClassName="accent-coral" />
        </View>
      </Screen>
    );
  }
  let lastDate = '';

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
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
        <EmptyState icon="history" title="No visitor history" subtitle="Past visitors will appear here." />
      )}
    </Screen>
  );
}
