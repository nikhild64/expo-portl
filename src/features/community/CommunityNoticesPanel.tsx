import { useCallback, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Chip, EmptyState, SkeletonCard, Button } from '@/components';
import { MediumGapSeparator } from '@/components/listSeparators';
import { NoticeCard } from '@/features/notices/NoticeCard';
import { flattenNoticePages, useNoticeCounts, useNotices } from '@/queries/useNotices';
import { useAuthStore } from '@/stores/authStore';
import type { Tables } from '@/types/database';

type NoticeFilter = Tables<'notices'>['category'] | 'all' | 'pinned';

export function CommunityNoticesPanel() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<NoticeFilter>('all');
  const societyId = useAuthStore((s) => s.profile?.society_id);
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useNotices(societyId, filter);
  const notices = flattenNoticePages(data?.pages);
  const { data: counts } = useNoticeCounts(societyId);

  const filters: { label: string; value: NoticeFilter; countKey?: 'all' | 'pinned' | 'event' | 'maintenance' | 'general' | 'emergency' }[] = useMemo(
    () => [
      { label: t('resident.community.noticeFilters.all'), value: 'all', countKey: 'all' },
      { label: t('resident.community.noticeFilters.pinned'), value: 'pinned', countKey: 'pinned' },
      { label: t('resident.community.noticeFilters.events'), value: 'event', countKey: 'event' },
      { label: t('resident.community.noticeFilters.maintenance'), value: 'maintenance', countKey: 'maintenance' },
      { label: t('resident.community.noticeFilters.general'), value: 'general', countKey: 'general' },
      { label: t('resident.community.noticeFilters.emergency'), value: 'emergency', countKey: 'emergency' },
    ],
    [t],
  );

  const listHeader = useMemo(
    () => (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 16 }}>
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
    ),
    [counts, filter, filters],
  );

  const listFooter = useMemo(
    () =>
      hasNextPage ? (
        <Button
          label={t('common.loadMore')}
          variant="outlined"
          loading={isFetchingNextPage}
          onPress={() => fetchNextPage()}
          className="mt-md"
        />
      ) : null,
    [fetchNextPage, hasNextPage, isFetchingNextPage, t],
  );

  const renderItem = useCallback(
    ({ item }: { item: Tables<'notices'> }) => (
      <NoticeCard
        notice={item}
        onPress={() => router.push({ pathname: '/(resident)/(community)/notices/[id]', params: { id: item.id } })}
      />
    ),
    [],
  );

  const listEmpty = useMemo(
    () => <EmptyState icon="campaign" title={t('resident.community.noNotices')} subtitle={t('resident.community.noNoticesSub')} />,
    [t],
  );

  if (isLoading) {
    return (
      <View className="gap-md">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </View>
    );
  }

  return (
    <FlashList
      key={filter}
      data={notices}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ListHeaderComponent={listHeader}
      ListFooterComponent={listFooter}
      ListEmptyComponent={listEmpty}
      ItemSeparatorComponent={MediumGapSeparator}
      contentContainerStyle={{ paddingBottom: 96 }}
    />
  );
}
