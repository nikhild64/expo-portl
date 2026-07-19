import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, Card, ListRow, Screen, ScreenLoading, Text } from '@/components';
import { NoticeCard } from '@/features/notices/NoticeCard';
import { flattenNoticePages, useNotices } from '@/queries/useNotices';
import { useAuthStore } from '@/stores/authStore';

export default function AdminCommunityScreen() {
  const { t } = useTranslation();
  const societyId = useAuthStore((s) => s.profile?.society_id);
  const { data, isLoading } = useNotices(societyId);
  const recentNotices = flattenNoticePages(data?.pages).slice(0, 3);

  if (isLoading) return <ScreenLoading variant="tab" safeTop />;

  return (
    <Screen scroll variant="tab" safeTop>
      <Button
        label={t('admin.community.newNotice')}
        icon="add"
        onPress={() => router.push('/(admin)/(community)/notices/new')}
      />

      {recentNotices.length > 0 ? (
        <View className="gap-sm">
          <Text variant="caption" color="textSecondary">
            {t('resident.home.recentNotices')}
          </Text>
          {recentNotices.map((notice) => (
            <NoticeCard
              key={notice.id}
              notice={notice}
              onPress={() => router.push(`/(admin)/(community)/notices/${notice.id}/edit`)}
            />
          ))}
        </View>
      ) : null}

      <Card padding="none" className="overflow-hidden">
        <ListRow title={t('nav.screens.notices')} subtitle={t('admin.community.newNotice')} showChevron onPress={() => router.push('/(admin)/(community)/notices')} />
        <ListRow title={t('nav.screens.polls')} subtitle={t('admin.community.newPoll')} showChevron onPress={() => router.push('/(admin)/(community)/polls')} />
        <ListRow title={t('nav.screens.amenities')} subtitle={t('admin.community.bookingsCalendar')} showChevron onPress={() => router.push('/(admin)/(community)/amenities')} />
      </Card>
    </Screen>
  );
}
