
import { alert } from '@/lib/alert';

import { Screen, ScreenLoading } from '@/components';
import { SocietySettingsForm, type SocietySettingsValues } from '@/features/admin/SocietySettingsForm';
import { useSociety, useUpdateSociety } from '@/queries/useSocietyAdmin';
import { useAuthStore } from '@/stores/authStore';

export default function SocietySettingsScreen() {
  const societyId = useAuthStore((s) => s.profile?.society_id);
  const { data: society, isLoading } = useSociety(societyId);
  const updateSociety = useUpdateSociety();

  if (isLoading || !society) return <ScreenLoading safe={false} />;

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
      alert('Society updated');
    } catch (error) {
      alert('Update failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <SocietySettingsForm society={society} loading={updateSociety.isPending} onSubmit={save} />
    </Screen>
  );
}
