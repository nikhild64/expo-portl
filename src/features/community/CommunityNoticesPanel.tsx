import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router, type Href } from 'expo-router';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';

import { Chip, EmptyState, SkeletonCard } from '@/components';
import { NoticeCard } from '@/features/notices/NoticeCard';
import { useNoticeCounts, useNotices } from '@/queries/useNotices';
import { useRealtimeTable } from '@/queries/useRealtimeTable';
import { useAuthStore } from '@/stores/authStore';
import type { Tables } from '@/types/database';

type NoticeFilter = Tables<'notices'>['category'] | 'all' | 'pinned';

const filters: { label: string; value: NoticeFilter; countKey?: 'all' | 'pinned' | 'event' | 'maintenance' | 'general' }[] = [
  { label: 'All', value: 'all', countKey: 'all' },
  { label: 'Pinned', value: 'pinned', countKey: 'pinned' },
  { label: 'Events', value: 'event', countKey: 'event' },
  { label: 'Maintenance', value: 'maintenance', countKey: 'maintenance' },
  { label: 'General', value: 'general', countKey: 'general' },
];

export function CommunityNoticesPanel() {
  const [filter, setFilter] = useState<NoticeFilter>('all');
  const societyId = useAuthStore((s) => s.profile?.society_id);
  const { data: notices, isLoading } = useNotices(societyId, filter);
  const { data: counts } = useNoticeCounts(societyId);

  useRealtimeTable({
    enabled: !!societyId,
    filter: `society_id=eq.${societyId}`,
    invalidateKeys: [['notices', societyId]],
    table: 'notices',
  });

  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {filters.map((item) => (
          <Chip
            key={item.value}
            label={item.label}
            count={item.countKey ? counts?.[item.countKey] : undefined}
            selected={filter === item.value}
            onPress={() => setFilter(item.value)}
          />
        ))}
      </ScrollView>

      <View className="gap-md">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : notices?.length ? (
          notices.map((notice, index) => (
            <Animated.View
              key={notice.id}
              entering={FadeInDown.delay(Math.min(index, 6) * 40).duration(250)}
              layout={LinearTransition.duration(250)}
            >
              <NoticeCard
                notice={notice}
                onPress={() => router.push(`/(resident)/(community)/notices/${notice.id}` as Href)}
              />
            </Animated.View>
          ))
        ) : (
          <EmptyState icon="campaign" title="No notices" subtitle="Society notices will appear here." />
        )}
      </View>
    </>
  );
}
