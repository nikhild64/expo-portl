import { useState } from 'react';
import { alert } from '@/lib/alert';
import { RefreshControl, ScrollView, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useCSSVariable } from 'uniwind';

import { Card, Chip, EmptyState, Screen, SkeletonCard, Text } from '@/components';
import { LogRow } from '@/features/guard/LogRow';
import { useQueryRefresh } from '@/queries/useNotificationPreferences';
import { useTowersBySociety } from '@/queries/useTowersBySociety';
import { useMarkExit, useVisitorLog } from '@/queries/useVisitorLog';
import { useAuthStore } from '@/stores/authStore';

export default function GuardLogScreen() {
  const coral = useCSSVariable('--color-coral') as string;
  const [towerId, setTowerId] = useState<string | null>(null);
  const [exitingId, setExitingId] = useState<string>();
  const profile = useAuthStore((s) => s.profile);
  const { data: towers } = useTowersBySociety(profile?.society_id);
  const log = useVisitorLog(profile?.society_id, towerId);
  const markExit = useMarkExit();
  const { refreshing, refresh } = useQueryRefresh([['visitor-log']]);

  const handleMarkExit = (visitorId: string) => {
    setExitingId(visitorId);
    markExit.mutate(visitorId, {
      onError: (error) => alert('Could not mark exit', error instanceof Error ? error.message : 'Please try again.'),
      onSettled: () => setExitingId(undefined),
    });
  };

  return (
    <Screen safe={false} padded={false}>
      <View className="gap-md px-base pb-md pt-sm">
        <Card className="gap-sm">
          <Text variant="caption" color="textSecondary">
            FILTERS
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            <Chip label="Today" selected icon="calendar_today" />
            <Chip label="All towers" selected={!towerId} onPress={() => setTowerId(null)} />
            {towers?.map((tower) => (
              <Chip key={tower.id} label={tower.name} selected={towerId === tower.id} onPress={() => setTowerId(tower.id)} />
            ))}
          </ScrollView>
        </Card>
      </View>

      {log.isLoading ? (
        <View className="px-base">
          <SkeletonCard />
        </View>
      ) : (
        <FlashList
          data={log.data ?? []}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={coral} colors={[coral]} />}
          renderItem={({ item }) => (
            <LogRow visitor={item} loading={exitingId === item.id && markExit.isPending} onMarkExit={handleMarkExit} />
          )}
          ListEmptyComponent={
            <View className="px-base">
              <EmptyState icon="history" title="No visitors today" subtitle="Entries and exits will appear here." />
            </View>
          }
          contentContainerStyle={{ paddingBottom: 96 }}
        />
      )}
    </Screen>
  );
}
