import { Alert } from 'react-native';
import { router, type Href } from 'expo-router';

import { Card, EmptyState, ListRow, Screen, ScreenLoading, StatusPill } from '@/components';
import { StaffForm, type StaffFormValues } from '@/features/admin/StaffForm';
import { titleize } from '@/lib/format';
import { useStaff, useUpsertStaff } from '@/queries/useStaff';
import { useAuthStore } from '@/stores/authStore';

export default function AdminStaffScreen() {
  const societyId = useAuthStore((s) => s.profile?.society_id);
  const { data: staff = [], isLoading } = useStaff(societyId);
  const upsertStaff = useUpsertStaff();

  if (isLoading) return <ScreenLoading safe={false} />;

  const save = async (values: StaffFormValues) => {
    if (!societyId) return;
    try {
      await upsertStaff.mutateAsync({
        active: values.active,
        name: values.name,
        phone: values.phone || null,
        photo_url: values.photoUrl || null,
        role: values.role,
        shift_end: values.shiftEnd || null,
        shift_start: values.shiftStart || null,
        society_id: societyId,
        verified: values.verified,
      });
      Alert.alert('Staff saved');
    } catch (error) {
      Alert.alert('Save failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <StaffForm loading={upsertStaff.isPending} onSubmit={save} />
      <Card padding="none" className="overflow-hidden">
        {staff.map((member) => (
          <ListRow
            key={member.id}
            title={member.name}
            subtitle={`${titleize(member.role)} - ${member.phone ?? 'No phone'}`}
            right={<StatusPill tone={member.active ? 'success' : 'neutral'} label={member.active ? 'Active' : 'Inactive'} />}
            onPress={() => router.push(`/(admin)/(society)/staff/${member.id}` as Href)}
          />
        ))}
        {!staff.length && <EmptyState icon="person" title="No staff yet" subtitle="Add staff above." />}
      </Card>
    </Screen>
  );
}
