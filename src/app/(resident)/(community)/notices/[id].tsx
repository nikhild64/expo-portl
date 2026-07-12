import { useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';

import { Card, EmptyState, Screen, SkeletonCard, StatusPill, Text } from '@/components';
import { NoticeReactions } from '@/features/notices/NoticeReactions';
import { formatDate, titleize } from '@/lib/format';
import { useMarkNoticeRead } from '@/queries/useNoticeReactions';
import { useNotice } from '@/queries/useNotices';

export default function NoticeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: notice, isLoading, error } = useNotice(id);
  const { mutate: markRead } = useMarkNoticeRead(id);

  useEffect(() => {
    if (id) markRead();
  }, [id, markRead]);

  if (isLoading) return <SkeletonCard />;

  if (error || !notice) {
    return <EmptyState icon="error_outline" title="Notice not found" subtitle="This notice may have been removed." />;
  }

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <Card className="gap-md">
        <StatusPill tone={notice.pinned ? 'warning' : 'info'} label={notice.pinned ? 'Pinned' : titleize(notice.category)} />
        <Text variant="titleLarge">{notice.title}</Text>
        <Text variant="footnote" color="textTertiary">
          Published {formatDate(notice.published_at)}
        </Text>
        <Text variant="body">{notice.body}</Text>
      </Card>
      <NoticeReactions noticeId={notice.id} />
    </Screen>
  );
}
