import { useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Card, Screen, ScreenEmpty, ScreenLoading, StatusPill, Text } from '@/components';
import { NoticeReactions } from '@/features/notices/NoticeReactions';
import { formatDate, titleize } from '@/lib/format';
import { useMarkNoticeRead } from '@/queries/useNoticeReactions';
import { useNotice } from '@/queries/useNotices';

export default function NoticeDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: notice, isLoading, error } = useNotice(id);
  const { mutate: markRead } = useMarkNoticeRead(id);

  useEffect(() => {
    if (id) markRead();
  }, [id, markRead]);

  if (isLoading) return <ScreenLoading variant="tab" />;

  if (error || !notice) {
    return (
      <ScreenEmpty
        safe={false}
        icon="error_outline"
        title={t('resident.community.noticeNotFound')}
        subtitle={t('resident.community.noticeNotFoundSub')}
      />
    );
  }

  return (
    <Screen scroll variant="tab">
      <Card className="gap-md">
        <StatusPill
          tone={notice.pinned ? 'warning' : 'info'}
          label={notice.pinned ? t('common.pinned') : titleize(notice.category)}
        />
        <Text variant="titleLarge">{notice.title}</Text>
        <Text variant="footnote" color="textTertiary">
          {t('resident.community.publishedAt', { date: formatDate(notice.published_at) })}
        </Text>
        <Text variant="body">{notice.body}</Text>
      </Card>
      <NoticeReactions noticeId={notice.id} />
    </Screen>
  );
}
