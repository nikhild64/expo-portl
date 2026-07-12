import { Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

import { Button, Screen, SkeletonCard } from '@/components';
import { StaffForm, type StaffFormValues } from '@/features/admin/StaffForm';
import { useDeleteStaff, useStaffMember, useUpsertStaff } from '@/queries/useStaff';

export default function AdminStaffDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: staff, isLoading } = useStaffMember(id);
  const upsertStaff = useUpsertStaff();
  const deleteStaff = useDeleteStaff();

  if (isLoading || !staff) return <SkeletonCard />;

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
    Alert.alert('Staff updated');
  };

  const remove = () => {
    Alert.alert('Delete staff?', 'This removes the staff member from the resident directory.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
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
      <Button label="Delete staff" variant="danger" icon="delete" loading={deleteStaff.isPending} onPress={remove} />
    </Screen>
  );
}
