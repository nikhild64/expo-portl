
import { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { alertConfirmDestructive } from '@/lib/alert';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button, Screen, ScreenLoading } from '@/components';
import { MediumGapSeparator } from '@/components/listSeparators';
import { NoticeCard } from '@/features/notices/NoticeCard';
import { useDeleteNotice } from '@/queries/useNoticeMutations';
import { flattenNoticePages, useNotices } from '@/queries/useNotices';
import { useAuthStore } from '@/stores/authStore';
import type { Tables } from '@/types/database';

export default function AdminNoticesScreen() {
  const { t } = useTranslation();
  const societyId = useAuthStore((s) => s.profile?.society_id);
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useNotices(societyId);
  const notices = flattenNoticePages(data?.pages);
  const deleteNotice = useDeleteNotice();

  const remove = useCallback(
    (id: string) => {
      alertConfirmDestructive(
        t('alert.titles.deleteNotice'),
        t('alert.messages.noticeHidden'),
        () => deleteNotice.mutate(id),
      );
    },
    [deleteNotice, t],
  );

  const listHeader = useMemo(
    () => (
      <Button
        label={t('admin.community.newNotice')}
        icon="add"
        onPress={() => router.push('/(admin)/(community)/notices/new')}
        className="mb-md mt-sm"
      />
    ),
    [t],
  );

  const listFooter = useMemo(
    () => (
      <View className="gap-md mt-md">
        {hasNextPage ? (
          <Button
            label={t('common.loadMore')}
            variant="outlined"
            loading={isFetchingNextPage}
            onPress={() => fetchNextPage()}
          />
        ) : null}
        {notices.length > 0 ? (
          <Button
            label={t('admin.community.deleteLatestNotice')}
            variant="outlined"
            icon="delete"
            loading={deleteNotice.isPending}
            onPress={() => remove(notices[0].id)}
          />
        ) : null}
      </View>
    ),
    [deleteNotice.isPending, fetchNextPage, hasNextPage, isFetchingNextPage, notices, remove, t],
  );

  const renderItem = useCallback(
    ({ item }: { item: Tables<'notices'> }) => (
      <NoticeCard notice={item} onPress={() => router.push(`/(admin)/(community)/notices/${item.id}/edit`)} />
    ),
    [],
  );

  if (isLoading) return <ScreenLoading variant="tab" />;

  return (
    <Screen safe={false} padded={false} className="flex-1 px-base">
      <FlashList
        data={notices}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        ItemSeparatorComponent={MediumGapSeparator}
        contentContainerStyle={{ paddingBottom: 96 }}
      />
    </Screen>
  );
}
