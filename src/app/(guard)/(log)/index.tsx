import { useCallback, useMemo, useState } from 'react';
import { alertError } from '@/lib/alert';
import { RefreshControl, ScrollView, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';
import { useCSSVariable } from 'uniwind';

import { Card, Chip, EmptyState, Screen, SkeletonCard, Text } from '@/components';
import { LogRow } from '@/features/guard/LogRow';
import { storageObjectPath, useSignedUrlMap, signedUrlForPath, VISITOR_PHOTOS_BUCKET } from '@/lib/storage';
import { useQueryRefresh } from '@/queries/useNotificationPreferences';
import { useRealtimeTable } from '@/queries/useRealtimeTable';
import { useTowersBySociety } from '@/queries/useTowersBySociety';
import { useMarkExit, useVisitorLog, type VisitorLogRow } from '@/queries/useVisitorLog';
import { useAuthStore } from '@/stores/authStore';

export default function GuardLogScreen() {
  const { t } = useTranslation();
  const coral = useCSSVariable('--color-coral') as string;
  const [towerId, setTowerId] = useState<string | null>(null);
  const [exitingId, setExitingId] = useState<string>();
  const profile = useAuthStore((s) => s.profile);
  const societyId = profile?.society_id;
  const { data: towers } = useTowersBySociety(societyId);
  const log = useVisitorLog(societyId, towerId);
  const markExit = useMarkExit();
  const { refreshing, refresh } = useQueryRefresh([['visitor-log'], ['guard-stats'], ['guard-activity']]);

  useRealtimeTable({
    enabled: !!societyId,
    event: '*',
    filter: societyId ? `society_id=eq.${societyId}` : undefined,
    invalidateKeys: [['visitor-log'], ['guard-stats'], ['guard-activity']],
    table: 'visitors',
  });

  const signedUrlMap = useSignedUrlMap(
    VISITOR_PHOTOS_BUCKET,
    useMemo(() => (log.data ?? []).map((visitor) => visitor.visitor_photo_path), [log.data]),
  );

  const handleMarkExit = useCallback(
    (visitorId: string) => {
      setExitingId(visitorId);
      markExit.mutate(visitorId, {
        onError: (error) =>
          alertError(t('alert.titles.couldNotMarkExit'), error),
        onSettled: () => setExitingId(undefined),
      });
    },
    [markExit, t],
  );

  const renderItem = useCallback(
    ({ item }: { item: VisitorLogRow }) => {
      const imageUri = signedUrlForPath(signedUrlMap, item.visitor_photo_path, VISITOR_PHOTOS_BUCKET);
      return (
        <LogRow
          visitor={item}
          imageUri={imageUri}
          loading={exitingId === item.id && markExit.isPending}
          onMarkExit={handleMarkExit}
        />
      );
    },
    [exitingId, handleMarkExit, markExit.isPending, signedUrlMap],
  );

  return (
    <Screen safe={false} padded={false}>
      <View className="gap-md px-base pb-md pt-sm">
        <Card className="gap-sm">
          <Text variant="caption" color="textSecondary">
            FILTERS
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            <Chip label={t('guard.log.today')} selected icon="calendar_today" />
            <Chip label={t('guard.log.allTowers')} selected={!towerId} onPress={() => setTowerId(null)} />
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
          renderItem={renderItem}
          ListEmptyComponent={
            <View className="px-base">
              <EmptyState
                icon="history"
                title={t('guard.log.noVisitorsToday')}
                subtitle={t('guard.log.noVisitorsTodaySub')}
              />
            </View>
          }
          contentContainerStyle={{ paddingBottom: 96 }}
        />
      )}
    </Screen>
  );
}
