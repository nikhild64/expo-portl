
import { alert } from '@/lib/alert';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button, Screen, ScreenLoading } from '@/components';
import { StaffForm, type StaffFormValues } from '@/features/admin/StaffForm';
import { useDeleteStaff, useStaffMember, useUpsertStaff } from '@/queries/useStaff';

export default function AdminStaffDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: staff, isLoading } = useStaffMember(id);
  const upsertStaff = useUpsertStaff();
  const deleteStaff = useDeleteStaff();

  if (isLoading || !staff) return <ScreenLoading safe={false} />;

  const save = async (values: StaffFormValues) => {
    await upsertStaff.mutateAsync({
      active: values.active,
      id: staff.id,
      name: values.name,
      phone: values.phone || null,
      photo_url: values.photoUrl || null,
      role: values.role,
      shift_end: values.shiftEnd || null,
      shift_start: values.shiftStart || null,
      verified: values.verified,
    });
    alert(t('alert.titles.staffUpdated'));
  };

  const remove = () => {
    alert(t('alert.titles.deleteStaff'), t('alert.messages.removeStaff'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteStaff.mutateAsync(staff.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <StaffForm staff={staff} loading={upsertStaff.isPending} onSubmit={save} />
      <Button label={`${t('common.delete')} ${t('nav.screens.staff').toLowerCase()}`} variant="danger" icon="delete" loading={deleteStaff.isPending} onPress={remove} />
    </Screen>
  );
}
