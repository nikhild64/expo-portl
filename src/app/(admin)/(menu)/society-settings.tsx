
import { alertError, alertSuccess } from '@/lib/alert';
import { useTranslation } from 'react-i18next';

import { Screen, ScreenLoading } from '@/components';
import { SocietySettingsForm, type SocietySettingsValues } from '@/features/admin/SocietySettingsForm';
import { useSociety, useUpdateSociety } from '@/queries/useSocietyAdmin';
import { useAuthStore } from '@/stores/authStore';

export default function SocietySettingsScreen() {
  const { t } = useTranslation();
  const societyId = useAuthStore((s) => s.profile?.society_id);
  const { data: society, isLoading } = useSociety(societyId);
  const updateSociety = useUpdateSociety();

  if (isLoading || !society) return <ScreenLoading variant="tab" />;

  const save = async (values: SocietySettingsValues) => {
    try {
      await updateSociety.mutateAsync({
        id: society.id,
        patch: {
          address: values.address || null,
          city: values.city || null,
          logo_url: values.logoUrl || null,
          name: values.name,
        },
      });
      alertSuccess(t('alert.titles.societyUpdated'));
    } catch (error) {
      alertError(t('alert.titles.updateFailed'), error);
    }
  };

  return (
    <Screen scroll variant="tab">
      <SocietySettingsForm society={society} loading={updateSociety.isPending} onSubmit={save} />
    </Screen>
  );
}
