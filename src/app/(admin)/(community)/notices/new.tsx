
import { alert } from '@/lib/alert';
import { router } from 'expo-router';

import { Screen } from '@/components';
import { NoticeForm, type NoticeFormValues } from '@/features/admin/NoticeForm';
import { useCreateNotice } from '@/queries/useNoticeMutations';
import { useAuthStore } from '@/stores/authStore';

function draftDate() {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 10);
  return date.toISOString();
}

export default function NewNoticeScreen() {
  const profile = useAuthStore((s) => s.profile);
  const createNotice = useCreateNotice();

  const save = async (values: NoticeFormValues, publishedAt: string) => {
    if (!profile?.id || !profile.society_id) return;
    try {
      await createNotice.mutateAsync({
        attachments: [],
        body: values.body,
        category: values.category,
        created_by: profile.id,
        pinned: values.pinned,
        published_at: publishedAt,
        society_id: profile.society_id,
        target_audience: { roles: ['resident'] },
        title: values.title,
      });
      router.back();
    } catch (error) {
      alert('Save failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <NoticeForm
        loading={createNotice.isPending}
        onSaveDraft={(values) => save(values, draftDate())}
        onPublish={(values) => save(values, new Date().toISOString())}
      />
    </Screen>
  );
}
