import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router, type Href } from 'expo-router';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';

import { Chip, EmptyState, Screen, SkeletonCard, Text } from '@/components';
import { NoticeCard } from '@/features/notices/NoticeCard';
import { useNotices } from '@/queries/useNotices';
import { useRealtimeTable } from '@/queries/useRealtimeTable';
import { useAuthStore } from '@/stores/authStore';
import type { Tables } from '@/types/database';

type NoticeFilter = Tables<'notices'>['category'] | 'all' | 'pinned';

const filters: { label: string; value: NoticeFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pinned', value: 'pinned' },
  { label: 'Events', value: 'event' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'General', value: 'general' },
  { label: 'Financial', value: 'financial' },
];

export default function CommunityScreen() {
  const [filter, setFilter] = useState<NoticeFilter>('all');
  const societyId = useAuthStore((s) => s.profile?.society_id);
  const { data: notices, isLoading } = useNotices(societyId, filter);

  useRealtimeTable({
    enabled: !!societyId,
    filter: `society_id=eq.${societyId}`,
    invalidateKeys: [['notices', societyId]],
    table: 'notices',
  });

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        <Chip label="Notices" selected />
        <Chip label="Polls" icon="poll" onPress={() => router.push('/(resident)/(community)/polls' as Href)} />
        <Chip label="Directory" icon="phone" onPress={() => router.push('/(resident)/(community)/directory' as Href)} />
      </ScrollView>

      <View className="gap-sm">
        <Text variant="caption" color="textSecondary">
          NOTICE FILTERS
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {filters.map((item) => (
            <Chip key={item.value} label={item.label} selected={filter === item.value} onPress={() => setFilter(item.value)} />
          ))}
        </ScrollView>
      </View>

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
              entering={FadeInDown.delay(Math.min(index, 6) * 30).duration(200)}
              layout={LinearTransition}
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
    </Screen>
  );
}
