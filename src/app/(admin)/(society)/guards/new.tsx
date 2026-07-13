import { alert } from '@/lib/alert';
import { router } from 'expo-router';

import { Screen } from '@/components';
import { GuardForm, type GuardFormValues } from '@/features/admin/GuardForm';
import { useCreateGuard } from '@/queries/useCreateGuard';

export default function CreateGuardScreen() {
  const createGuard = useCreateGuard();

  const save = async (values: GuardFormValues) => {
    try {
      const result = await createGuard.mutateAsync({
        email: values.email,
        fullName: values.fullName,
        password: values.password,
        phone: values.phone || null,
      });

      alert('Guard account created', `${result.fullName} can sign in with ${result.email}.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      alert('Could not create guard', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <GuardForm loading={createGuard.isPending} onSubmit={save} />
    </Screen>
  );
}
