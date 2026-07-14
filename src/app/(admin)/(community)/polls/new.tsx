
import { alertError } from '@/lib/alert';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components';
import { PollForm, pollOptions, type PollFormValues } from '@/features/admin/PollForm';
import { useCreatePoll } from '@/queries/usePollMutations';
import { useAuthStore } from '@/stores/authStore';

export default function NewPollScreen() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const createPoll = useCreatePoll();

  const save = async (values: PollFormValues) => {
    if (!profile?.id || !profile.society_id) return;
    try {
      await createPoll.mutateAsync({
        allow_multiple: values.allowMultiple,
        anonymous: values.anonymous,
        category: values.category,
        created_by: profile.id,
        ends_at: values.endsAt,
        options: pollOptions(values),
        question: values.question,
        quorum: values.quorum,
        show_results: values.showResults,
        society_id: profile.society_id,
        starts_at: values.startsAt,
        target_audience: { kind: 'roles', roles: ['resident'] },
      });
      router.back();
    } catch (error) {
      alertError(t('alert.titles.saveFailed'), error);
    }
  };

  return (
    <Screen scroll variant="tab">
      <PollForm loading={createPoll.isPending} onSubmit={save} />
    </Screen>
  );
}
