
import { useLocalSearchParams } from 'expo-router';

import { Screen, ScreenLoading } from '@/components';
import { NoticeForm } from '@/features/admin/NoticeForm';
import { useNoticeSave } from '@/hooks/useNoticeSave';
import { useNotice } from '@/queries/useNotices';

export default function EditNoticeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: notice, isLoading } = useNotice(id);
  const { loading, onSaveDraft, onPublish } = useNoticeSave(notice);

  if (isLoading || !notice) return <ScreenLoading variant="tab" />;

  return (
    <Screen scroll variant="tab">
      <NoticeForm
        notice={notice}
        loading={loading}
        onSaveDraft={onSaveDraft}
        onPublish={onPublish}
      />
    </Screen>
  );
}
