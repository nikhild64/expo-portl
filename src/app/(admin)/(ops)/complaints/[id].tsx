import { Alert, View } from 'react-native';
import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';

import { Button, Card, Chip, Text } from '@/components';
import { ProfileSearchField } from '@/features/admin/ProfileSearchField';
import { ComplaintDetail } from '@/features/complaints/ComplaintDetail';
import { useUpdateComplaintAdmin } from '@/queries/useAdminComplaints';
import { useAuthStore } from '@/stores/authStore';
import type { Tables } from '@/types/database';
import { titleize } from '@/lib/format';

const statuses: Tables<'complaints'>['status'][] = ['new', 'assigned', 'in_progress', 'resolved', 'closed'];

export default function AdminComplaintDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const societyId = useAuthStore((s) => s.profile?.society_id);
  const [assigneeId, setAssigneeId] = useState('');
  const [assigneeKind, setAssigneeKind] = useState<'profile' | 'service_provider' | null>(null);
  const [assigneeLabel, setAssigneeLabel] = useState('');
  const updateComplaint = useUpdateComplaintAdmin();

  const updateStatus = async (status: Tables<'complaints'>['status']) => {
    try {
      await updateComplaint.mutateAsync({ id, patch: { resolved_at: status === 'resolved' || status === 'closed' ? new Date().toISOString() : null, status } });
    } catch (error) {
      Alert.alert('Update failed', error instanceof Error ? error.message : 'Please try again.');
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
      Alert.alert('Assignment failed', error instanceof Error ? error.message : 'Choose a person or provider from the list.');
    }
  };

  const clearAssignment = async () => {
    try {
      await updateComplaint.mutateAsync({ id, patch: { assigned_service_provider_id: null, assigned_to: null, status: 'new' } });
      setAssigneeId('');
      setAssigneeKind(null);
      setAssigneeLabel('');
    } catch (error) {
      Alert.alert('Update failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <>
      <Card className="gap-md mx-base mt-3">
        <Text variant="headline">Admin actions</Text>
        <View className="flex-row flex-wrap gap-sm">
          {statuses.map((status) => (
            <Chip key={status} label={status} onPress={() => updateStatus(status)} />
          ))}
        </View>
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
        <View className="flex-row gap-sm">
          <Button label="Assign selected person" variant="tonal" disabled={!assigneeId} loading={updateComplaint.isPending} onPress={assign} />
          <Button label="Unassign" variant="text" loading={updateComplaint.isPending} onPress={clearAssignment} />
        </View>
      </Card>
      <ComplaintDetail complaintId={id} />
    </>
  );
}
