
import { alert } from '@/lib/alert';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button, Screen, ScreenLoading } from '@/components';
import { NoticeCard } from '@/features/notices/NoticeCard';
import { useDeleteNotice } from '@/queries/useNoticeMutations';
import { useNotices } from '@/queries/useNotices';
import { useAuthStore } from '@/stores/authStore';

export default function AdminNoticesScreen() {
  const { t } = useTranslation();
  const societyId = useAuthStore((s) => s.profile?.society_id);
  const { data: notices = [], isLoading } = useNotices(societyId);
  const deleteNotice = useDeleteNotice();

  if (isLoading) return <ScreenLoading safe={false} />;

  const remove = (id: string) => {
    alert(t('alert.titles.deleteNotice'), t('alert.messages.noticeHidden'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteNotice.mutate(id) },
    ]);
  };

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <Button label={t('admin.community.newNotice')} icon="add" onPress={() => router.push('/(admin)/(community)/notices/new')} />
      {notices.map((notice) => (
        <NoticeCard key={notice.id} notice={notice} onPress={() => router.push(`/(admin)/(community)/notices/${notice.id}/edit`)} />
      ))}
      {!!notices.length && <Button label={t('admin.community.deleteLatestNotice')} variant="outlined" icon="delete" loading={deleteNotice.isPending} onPress={() => remove(notices[0].id)} />}
    </Screen>
  );
}
