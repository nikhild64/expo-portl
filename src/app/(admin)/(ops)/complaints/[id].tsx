import { View } from 'react-native';
import { alert } from '@/lib/alert';
import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const societyId = useAuthStore((s) => s.profile?.society_id);
  const { data: complaint } = useComplaint(id);
  const [assigneeId, setAssigneeId] = useState('');
  const [assigneeKind, setAssigneeKind] = useState<'profile' | 'service_provider' | null>(null);
  const [assigneeLabel, setAssigneeLabel] = useState('');
  const updateComplaint = useUpdateComplaintAdmin();
  const isAssigned = !!(complaint?.assigned_to || complaint?.assigned_service_provider_id);

  const complaintStatusLabel = (status: Tables<'complaints'>['status']) => {
    switch (status) {
      case 'new':
        return t('resident.complaints.timeline.new');
      case 'assigned':
        return t('resident.complaints.timeline.assigned');
      case 'in_progress':
        return t('resident.complaints.timeline.inProgress');
      case 'resolved':
        return t('resident.complaints.timeline.resolved');
      case 'closed':
        return t('common.closed');
      default:
        return titleize(status);
    }
  };

  const updateStatus = async (status: Tables<'complaints'>['status']) => {
    try {
      await updateComplaint.mutateAsync({ id, patch: { resolved_at: status === 'resolved' || status === 'closed' ? new Date().toISOString() : null, status } });
    } catch (error) {
      alert(t('alert.titles.updateFailed'), error instanceof Error ? error.message : t('common.pleaseTryAgain'));
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
      alert(t('alert.titles.assignmentFailed'), error instanceof Error ? error.message : t('admin.ops.choosePerson'));
    }
  };

  const clearAssignment = async () => {
    try {
      await updateComplaint.mutateAsync({ id, patch: { assigned_service_provider_id: null, assigned_to: null, status: 'new' } });
      setAssigneeId('');
      setAssigneeKind(null);
      setAssigneeLabel('');
    } catch (error) {
      alert(t('alert.titles.updateFailed'), error instanceof Error ? error.message : t('common.pleaseTryAgain'));
    }
  };

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <Card className="gap-md">
        <Text variant="headline">{t('admin.ops.adminActions')}</Text>
        <View className="flex-row flex-wrap gap-sm">
          {statuses.map((status) => (
            <Chip key={status} label={complaintStatusLabel(status)} onPress={() => updateStatus(status)} />
          ))}
        </View>
        {isAssigned ? (
          <Button label={t('admin.ops.unassign')} variant="text" loading={updateComplaint.isPending} onPress={clearAssignment} />
        ) : (
          <>
            <ProfileSearchField
              label={t('admin.ops.assignToPerson')}
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
              label={t('admin.ops.assignSelectedPerson')}
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
