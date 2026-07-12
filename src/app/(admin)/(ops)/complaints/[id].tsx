import { Alert, View } from 'react-native';
import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';

import { Button, Card, Chip, Field, Text } from '@/components';
import { ComplaintDetail } from '@/features/complaints/ComplaintDetail';
import { useUpdateComplaintAdmin } from '@/queries/useAdminComplaints';
import type { Tables } from '@/types/database';

const statuses: Tables<'complaints'>['status'][] = ['new', 'assigned', 'in_progress', 'resolved', 'closed'];

export default function AdminComplaintDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [assignee, setAssignee] = useState('');
  const updateComplaint = useUpdateComplaintAdmin();

  const updateStatus = async (status: Tables<'complaints'>['status']) => {
    try {
      await updateComplaint.mutateAsync({ id, patch: { resolved_at: status === 'resolved' || status === 'closed' ? new Date().toISOString() : null, status } });
    } catch (error) {
      Alert.alert('Update failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const assign = async () => {
    try {
      await updateComplaint.mutateAsync({ id, patch: { assigned_to: assignee || null, status: assignee ? 'assigned' : 'new' } });
      setAssignee('');
    } catch (error) {
      Alert.alert('Assignment failed', error instanceof Error ? error.message : 'Use a valid profile UUID.');
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
        <Field label="Assign to profile ID" value={assignee} onChangeText={setAssignee} placeholder="Profile UUID" autoCapitalize="none" />
        <Button label="Assign" variant="tonal" loading={updateComplaint.isPending} onPress={assign} />
      </Card>
      <ComplaintDetail complaintId={id} />
    </>
  );
}
