
import { alert } from '@/lib/alert';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen, ScreenLoading } from '@/components';
import { PollForm, pollOptions, type PollFormValues } from '@/features/admin/PollForm';
import { useUpdatePoll } from '@/queries/usePollMutations';
import { usePoll } from '@/queries/usePolls';

export default function EditPollScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: poll, isLoading } = usePoll(id);
  const updatePoll = useUpdatePoll();

  if (isLoading || !poll) return <ScreenLoading safe={false} />;

  const save = async (values: PollFormValues) => {
    try {
      await updatePoll.mutateAsync({
        id: poll.id,
        patch: {
          allow_multiple: values.allowMultiple,
          anonymous: values.anonymous,
          category: values.category,
          ends_at: values.endsAt,
          options: pollOptions(values),
          question: values.question,
          quorum: values.quorum,
          show_results: values.showResults,
          starts_at: values.startsAt,
        },
      });
      router.back();
    } catch (error) {
      alert(t('alert.titles.saveFailed'), error instanceof Error ? error.message : t('common.pleaseTryAgain'));
    }
  };

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <PollForm poll={poll} loading={updatePoll.isPending} onSubmit={save} />
    </Screen>
  );
}
