import { Alert } from 'react-native';
import { router } from 'expo-router';

import { Button, Screen, SkeletonCard } from '@/components';
import { NoticeCard } from '@/features/notices/NoticeCard';
import { useDeleteNotice } from '@/queries/useNoticeMutations';
import { useNotices } from '@/queries/useNotices';
import { useAuthStore } from '@/stores/authStore';

export default function AdminNoticesScreen() {
  const societyId = useAuthStore((s) => s.profile?.society_id);
  const { data: notices = [], isLoading } = useNotices(societyId);
  const deleteNotice = useDeleteNotice();

  if (isLoading) return <SkeletonCard />;

  const remove = (id: string) => {
    Alert.alert('Delete notice?', 'Residents will no longer see this notice.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteNotice.mutate(id) },
    ]);
  };

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <Button label="New notice" icon="add" onPress={() => router.push('/(admin)/(community)/notices/new' as never)} />
      {notices.map((notice) => (
        <NoticeCard key={notice.id} notice={notice} onPress={() => router.push(`/(admin)/(community)/notices/${notice.id}/edit` as never)} />
      ))}
      {!!notices.length && <Button label="Delete latest notice" variant="outlined" icon="delete" loading={deleteNotice.isPending} onPress={() => remove(notices[0].id)} />}
    </Screen>
  );
}
