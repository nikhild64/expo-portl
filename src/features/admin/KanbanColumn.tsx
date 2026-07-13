import { View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';

import { Card, EmptyState, Text } from '@/components';
import { ComplaintCard } from '@/features/complaints/ComplaintCard';
import type { Tables } from '@/types/database';

interface Props {
  title: string;
  complaints: Tables<'complaints'>[];
  onAction: (complaint: Tables<'complaints'>) => void;
}

export function KanbanColumn({ title, complaints, onAction }: Props) {
  const emptyTitle = title.toLowerCase() === 'new' ? 'No new tickets' : `No ${title.toLowerCase()} tickets`;

  return (
    <Card className="w-80 gap-md" padding="sm">
      <View className="flex-row items-center justify-between">
        <Text variant="headline">{title}</Text>
        <Text variant="caption" color="textSecondary">
          {complaints.length}
        </Text>
      </View>
      <FlashList
        data={complaints}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={<EmptyState icon="inbox" title={emptyTitle} subtitle="Tickets will appear here when they match this status." />}
        renderItem={({ item }) => (
          <View onTouchEnd={() => undefined}>
            <ComplaintCard complaint={item} onPress={() => router.push(`/(admin)/(ops)/complaints/${item.id}` as never)} />
            <View className="-mt-sm items-end">
              <Text variant="caption" color="coral" onPress={() => onAction(item)}>
                Actions
              </Text>
            </View>
          </View>
        )}
      />
    </Card>
  );
}
