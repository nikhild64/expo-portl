import { alertError, alertSuccess } from '@/lib/alert';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components';
import { GuardForm, type GuardFormValues } from '@/features/admin/GuardForm';
import { useCreateGuard } from '@/queries/useCreateGuard';

export default function CreateGuardScreen() {
  const { t } = useTranslation();
  const createGuard = useCreateGuard();

  const save = async (values: GuardFormValues) => {
    try {
      const result = await createGuard.mutateAsync({
        email: values.email,
        fullName: values.fullName,
        password: values.password,
        phone: values.phone || null,
      });

      alertSuccess(
        t('alert.titles.guardAccountCreated'),
        t('alert.messages.guardCanSignIn', { name: result.fullName, email: result.email }),
        [{ text: t('common.ok'), onPress: () => router.replace('/(admin)/(society)/guards') }],
      );
    } catch (error) {
      alertError(t('alert.titles.couldNotCreateGuard'), error);
    }
  };

  return (
    <Screen scroll variant="tab">
      <GuardForm loading={createGuard.isPending} onSubmit={save} />
    </Screen>
  );
}
