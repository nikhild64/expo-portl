
import { Screen } from '@/components';
import { NoticeForm } from '@/features/admin/NoticeForm';
import { useNoticeSave } from '@/hooks/useNoticeSave';

export default function NewNoticeScreen() {
  const { loading, onSaveDraft, onPublish } = useNoticeSave();

  return (
    <Screen scroll variant="tab">
      <NoticeForm loading={loading} onSaveDraft={onSaveDraft} onPublish={onPublish} />
    </Screen>
  );
}
