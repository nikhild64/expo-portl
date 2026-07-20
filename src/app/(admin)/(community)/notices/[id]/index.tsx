import { useCallback } from 'react';
import { View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button, Card, Screen, ScreenEmpty, ScreenLoading, StatusPill, Text } from '@/components';
import { NoticeReactions } from '@/features/notices/NoticeReactions';
import { alertConfirmDestructive } from '@/lib/alert';
import { formatDate, titleize } from '@/lib/format';
import { useDeleteNotice } from '@/queries/useNoticeMutations';
import { useNotice } from '@/queries/useNotices';

export default function AdminNoticeDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: notice, isLoading, error } = useNotice(id);
  const deleteNotice = useDeleteNotice();

  const handleDelete = useCallback(() => {
    if (!notice) return;
    alertConfirmDestructive(
      t('alert.titles.deleteNotice'),
      t('alert.messages.noticeHidden'),
      () => {
        deleteNotice.mutate(notice.id, {
          onSuccess: () => {
            router.back();
          },
        });
      },
    );
  }, [deleteNotice, notice, t]);

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: t('nav.screens.notice') }} />
        <ScreenLoading variant="tab" />
      </>
    );
  }

  if (error || !notice) {
    return (
      <>
        <Stack.Screen options={{ title: t('nav.screens.notice') }} />
        <ScreenEmpty
          safe={false}
          icon="error_outline"
          title={t('resident.community.noticeNotFound')}
          subtitle={t('resident.community.noticeNotFoundSub')}
        />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: notice.title }} />
      <Screen scroll variant="tab">
      <Card className="gap-md">
        <View className="flex-row items-center justify-between gap-sm">
          <StatusPill
            tone={notice.pinned ? 'warning' : 'info'}
            label={notice.pinned ? t('common.pinned') : titleize(notice.category)}
          />
          <Button
            label={t('common.edit')}
            icon="edit"
            size="sm"
            variant="tonal"
            onPress={() => router.push(`/(admin)/(community)/notices/${notice.id}/edit`)}
          />
        </View>

        <Text variant="titleLarge" className="font-bold">
          {notice.title}
        </Text>

        <Text variant="footnote" color="textTertiary">
          {t('resident.community.publishedAt', { date: formatDate(notice.published_at) })}
        </Text>

        <Text variant="body" className="leading-relaxed mt-xs">
          {notice.body}
        </Text>
      </Card>

      <NoticeReactions noticeId={notice.id} />

      <View className="mt-lg mb-md">
        <Button
          label={t('common.delete') || 'Delete Notice'}
          variant="outlined"
          icon="delete"
          loading={deleteNotice.isPending}
          onPress={handleDelete}
        />
      </View>
    </Screen>
    </>
  );
}
