import { View } from 'react-native';
import { alertError } from '@/lib/alert';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button, Card, Chip, Screen, StatusPill, Text } from '@/components';
import { ProfileSearchField } from '@/features/admin/ProfileSearchField';
import { ComplaintDetail } from '@/features/complaints/ComplaintDetail';
import {
  adminComplaintPrimaryAction,
  complaintStatusLabel,
  complaintStatusTone,
} from '@/features/complaints/complaintStatus';
import { useUpdateComplaintAdmin } from '@/queries/useAdminComplaints';
import { useComplaint } from '@/queries/useComplaints';
import { useAuthStore } from '@/stores/authStore';
import type { Tables } from '@/types/database';
import { formatAssigneeLabel } from '@/lib/format';

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
  const currentStatus = complaint?.status;
  const primaryAction = currentStatus ? adminComplaintPrimaryAction(currentStatus, t) : null;
  const isClosed = currentStatus === 'closed';

  const statusChipLabel = (status: Tables<'complaints'>['status']) => {
    if (status === 'closed') return t('common.closed');
    return complaintStatusLabel(status, t);
  };

  const updateStatus = async (status: Tables<'complaints'>['status']) => {
    if (!id || status === currentStatus) return;
    try {
      await updateComplaint.mutateAsync({
        id,
        patch: {
          resolved_at: status === 'resolved' || status === 'closed' ? new Date().toISOString() : null,
          status,
        },
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      alertError(t('alert.titles.updateFailed'), error);
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
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      alertError(t('alert.titles.assignmentFailed'), error, t('admin.ops.choosePerson'));
    }
  };

  const clearAssignment = async () => {
    try {
      await updateComplaint.mutateAsync({ id, patch: { assigned_service_provider_id: null, assigned_to: null, status: 'new' } });
      setAssigneeId('');
      setAssigneeKind(null);
      setAssigneeLabel('');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      alertError(t('alert.titles.updateFailed'), error);
    }
  };

  return (
    <Screen scroll variant="tab">
      <Card className="gap-md">
        <View className="flex-row items-center justify-between gap-md">
          <Text variant="headline">{t('admin.ops.adminActions')}</Text>
          {currentStatus ? (
            <StatusPill tone={complaintStatusTone(currentStatus)} label={complaintStatusLabel(currentStatus, t)} />
          ) : null}
        </View>

        {isClosed ? (
          <Text variant="body" color="textSecondary">
            {t('admin.ops.ticketClosed')}
          </Text>
        ) : primaryAction ? (
          <Button
            label={primaryAction.label}
            icon={primaryAction.icon}
            loading={updateComplaint.isPending}
            onPress={() => updateStatus(primaryAction.status)}
          />
        ) : null}

        <Text variant="caption" color="textSecondary">
          {t('resident.complaints.status')}
        </Text>
        <View className="flex-row flex-wrap gap-sm">
          {statuses.map((status) => (
            <Chip
              key={status}
              label={statusChipLabel(status)}
              selected={currentStatus === status}
              disabled={currentStatus === status || updateComplaint.isPending}
              onPress={() => updateStatus(status)}
            />
          ))}
        </View>

        {!isClosed && !isAssigned ? (
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
                setAssigneeLabel(formatAssigneeLabel(profile));
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
        ) : null}

        {!isClosed && isAssigned ? (
          <Button label={t('admin.ops.unassign')} variant="text" loading={updateComplaint.isPending} onPress={clearAssignment} />
        ) : null}
      </Card>
      <ComplaintDetail complaintId={id} embedded />
    </Screen>
  );
}
