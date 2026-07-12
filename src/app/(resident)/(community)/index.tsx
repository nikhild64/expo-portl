import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';

import { Chip, EmptyState, Screen, Text } from '@/components';
import { NoticeCard } from '@/features/notices/NoticeCard';
import { useNotices } from '@/queries/useNotices';
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
  const { data: notices } = useNotices(societyId, filter);

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        <Chip label="Notices" selected />
        <Chip label="Polls" icon="poll" onPress={() => router.push('/(resident)/(community)/polls' as never)} />
        <Chip label="Directory" icon="phone" onPress={() => router.push('/(resident)/(community)/directory' as never)} />
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
        {notices?.length ? (
          notices.map((notice) => (
            <NoticeCard
              key={notice.id}
              notice={notice}
              onPress={() => router.push(`/(resident)/(community)/notices/${notice.id}` as never)}
            />
          ))
        ) : (
          <EmptyState icon="campaign" title="No notices" subtitle="Society notices will appear here." />
        )}
      </View>
    </Screen>
  );
}
