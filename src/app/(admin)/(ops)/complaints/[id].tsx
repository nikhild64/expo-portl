import { View } from 'react-native';
import { alert } from '@/lib/alert';
import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';

import { Button, Card, Chip, Screen, Text } from '@/components';
import { ProfileSearchField } from '@/features/admin/ProfileSearchField';
import { ComplaintDetail } from '@/features/complaints/ComplaintDetail';
import { useUpdateComplaintAdmin } from '@/queries/useAdminComplaints';
import { useComplaint } from '@/queries/useComplaints';
import { useAuthStore } from '@/stores/authStore';
import type { Tables } from '@/types/database';
import { titleize } from '@/lib/format';

const statuses: Tables<'complaints'>['status'][] = ['new', 'assigned', 'in_progress', 'resolved', 'closed'];

export default function AdminComplaintDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const societyId = useAuthStore((s) => s.profile?.society_id);
  const { data: complaint } = useComplaint(id);
  const [assigneeId, setAssigneeId] = useState('');
  const [assigneeKind, setAssigneeKind] = useState<'profile' | 'service_provider' | null>(null);
  const [assigneeLabel, setAssigneeLabel] = useState('');
  const updateComplaint = useUpdateComplaintAdmin();
  const isAssigned = !!(complaint?.assigned_to || complaint?.assigned_service_provider_id);

  const updateStatus = async (status: Tables<'complaints'>['status']) => {
    try {
      await updateComplaint.mutateAsync({ id, patch: { resolved_at: status === 'resolved' || status === 'closed' ? new Date().toISOString() : null, status } });
    } catch (error) {
      alert('Update failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const assign = async () => {
    if (!assigneeId) return;
    try {
      await updateComplaint.mutateAsync({
        id,
        patch: {
          assigned_service_provider_id: assigneeKind === 'service_provider' ? assigneeId : null,
          assigned_to: assigneeKind === 'profile' ? assigneeId : null,
          status: 'assigned',
        },
      });
      setAssigneeId('');
      setAssigneeKind(null);
      setAssigneeLabel('');
    } catch (error) {
      alert('Assignment failed', error instanceof Error ? error.message : 'Choose a person or provider from the list.');
    }
  };

  const clearAssignment = async () => {
    try {
      await updateComplaint.mutateAsync({ id, patch: { assigned_service_provider_id: null, assigned_to: null, status: 'new' } });
      setAssigneeId('');
      setAssigneeKind(null);
      setAssigneeLabel('');
    } catch (error) {
      alert('Update failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <Card className="gap-md">
        <Text variant="headline">Admin actions</Text>
        <View className="flex-row flex-wrap gap-sm">
          {statuses.map((status) => (
            <Chip key={status} label={status} onPress={() => updateStatus(status)} />
          ))}
        </View>
        {isAssigned ? (
          <Button label="Unassign" variant="text" loading={updateComplaint.isPending} onPress={clearAssignment} />
        ) : (
          <>
            <ProfileSearchField
              label="Assign to person"
              selectedLabel={assigneeLabel}
              societyId={societyId}
              value={assigneeId}
              onClear={() => {
                setAssigneeId('');
                setAssigneeKind(null);
                setAssigneeLabel('');
              }}
              onSelect={(profile) => {
                setAssigneeId(profile.id);
                setAssigneeKind(profile.kind);
                setAssigneeLabel(
                  `${profile.full_name} (${profile.kind === 'service_provider' ? titleize(profile.category) : titleize(profile.role)})`,
                );
              }}
            />
            <Button
              label="Assign selected person"
              variant="tonal"
              disabled={!assigneeId}
              loading={updateComplaint.isPending}
              onPress={assign}
            />
          </>
        )}
      </Card>
      <ComplaintDetail complaintId={id} embedded />
    </Screen>
  );
}
