import { View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';

import { Card, EmptyState, Text } from '@/components';
import { ComplaintCard } from '@/features/complaints/ComplaintCard';
import { getComplaintQuickActions } from '@/features/complaints/complaintQuickActions';
import type { Tables } from '@/types/database';

interface Props {
  title: string;
  complaints: Tables<'complaints'>[];
  onUpdateStatus: (id: string, status: Tables<'complaints'>['status']) => void;
}

export function KanbanColumn({ title, complaints, onUpdateStatus }: Props) {
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
          <ComplaintCard
            complaint={item}
            onPress={() => router.push(`/(admin)/(ops)/complaints/${item.id}`)}
            actions={getComplaintQuickActions(item.status).map((action) => ({
              label: action.label,
              onPress: () => onUpdateStatus(item.id, action.status),
            }))}
          />
        )}
      />
    </Card>
  );
}
