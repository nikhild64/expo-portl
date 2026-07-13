
import { alert } from '@/lib/alert';
import { useLocalSearchParams, router } from 'expo-router';

import { Screen, ScreenLoading } from '@/components';
import { NoticeForm, type NoticeFormValues } from '@/features/admin/NoticeForm';
import { useUpdateNotice } from '@/queries/useNoticeMutations';
import { useNotice } from '@/queries/useNotices';

function draftDate() {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 10);
  return date.toISOString();
}

export default function EditNoticeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: notice, isLoading } = useNotice(id);
  const updateNotice = useUpdateNotice();

  if (isLoading || !notice) return <ScreenLoading safe={false} />;

  const save = async (values: NoticeFormValues, publishedAt: string) => {
    try {
      await updateNotice.mutateAsync({
        id: notice.id,
        patch: {
          body: values.body,
          category: values.category,
          pinned: values.pinned,
          published_at: publishedAt,
          title: values.title,
        },
      });
      router.back();
    } catch (error) {
      alert('Save failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <NoticeForm
        notice={notice}
        loading={updateNotice.isPending}
        onSaveDraft={(values) => save(values, draftDate())}
        onPublish={(values) => save(values, new Date().toISOString())}
      />
    </Screen>
  );
}
