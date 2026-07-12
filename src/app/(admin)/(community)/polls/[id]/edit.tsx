import { Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

import { Screen, SkeletonCard } from '@/components';
import { PollForm, pollOptions, type PollFormValues } from '@/features/admin/PollForm';
import { useUpdatePoll } from '@/queries/usePollMutations';
import { usePoll } from '@/queries/usePolls';

export default function EditPollScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: poll, isLoading } = usePoll(id);
  const updatePoll = useUpdatePoll();

  if (isLoading || !poll) return <SkeletonCard />;

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
      Alert.alert('Save failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <PollForm poll={poll} loading={updatePoll.isPending} onSubmit={save} />
    </Screen>
  );
}
