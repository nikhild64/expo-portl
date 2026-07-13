import { Alert } from 'react-native';

import { Button, Card, EmptyState, Screen, ScreenEmpty, ScreenLoading, SkeletonCard, Text } from '@/components';
import { formatDateTime, titleize } from '@/lib/format';
import { useCloseComplaint, useComplaint, useComplaintUpdates } from '@/queries/useComplaints';
import { useRealtimeTable } from '@/queries/useRealtimeTable';
import { useAuthStore } from '@/stores/authStore';

import { CommentThread } from './CommentThread';
import { PhotoGrid } from './PhotoGrid';
import { StatusTimeline } from './StatusTimeline';

interface Props {
  complaintId?: string;
  embedded?: boolean;
}

export function ComplaintDetail({ complaintId, embedded = false }: Props) {
  const uid = useAuthStore((s) => s.session?.user.id);
  const { data: complaint, isLoading, error } = useComplaint(complaintId);
  const { data: updates = [] } = useComplaintUpdates(complaintId);
  const closeComplaint = useCloseComplaint();

  useRealtimeTable({
    enabled: !!complaintId,
    filter: `id=eq.${complaintId}`,
    invalidateKeys: [['complaints', 'detail', complaintId]],
    table: 'complaints',
  });
  useRealtimeTable({
    enabled: !!complaintId,
    filter: `complaint_id=eq.${complaintId}`,
    invalidateKeys: [['complaint-updates', complaintId]],
    table: 'complaint_updates',
  });

  if (isLoading) {
    return embedded ? <SkeletonCard /> : <ScreenLoading safe={false} />;
  }

  if (error || !complaint) {
    const emptyProps = {
      icon: 'error_outline' as const,
      title: 'Complaint not found',
      subtitle: 'This complaint may have been removed.',
    };
    return embedded ? <EmptyState {...emptyProps} /> : <ScreenEmpty safe={false} {...emptyProps} />;
  }

  const assignedName = typeof complaint.assigned === 'object' && complaint.assigned ? complaint.assigned.full_name : null;
  const assignedProvider =
    typeof complaint.assigned_service_provider === 'object' && complaint.assigned_service_provider
      ? complaint.assigned_service_provider
      : null;
  const assigneeLabel = assignedName ?? (assignedProvider ? `${assignedProvider.name} (${titleize(assignedProvider.category)})` : null);
  const canClose = !embedded && complaint.raised_by === uid && complaint.status !== 'closed';
  const closeMessage =
    complaint.status === 'resolved'
      ? 'This issue has been marked resolved. Close the ticket if you are satisfied with the outcome.'
      : 'Close this ticket if the issue is fixed or no longer needs attention.';

  const handleClose = () => {
    Alert.alert('Close ticket?', 'This will mark the ticket as closed.', [
      { style: 'cancel', text: 'Cancel' },
      {
        text: 'Close ticket',
        onPress: async () => {
          try {
            await closeComplaint.mutateAsync(complaint.id);
          } catch (closeError) {
            Alert.alert('Could not close ticket', closeError instanceof Error ? closeError.message : 'Please try again.');
          }
        },
      },
    ]);
  };

  const content = (
    <>
      <Card className="gap-md">
        <Text variant="caption" color="textSecondary">
          {titleize(complaint.category)} - {titleize(complaint.priority)}
        </Text>
        <Text variant="titleLarge">{complaint.title}</Text>
        <Text variant="footnote" color="textTertiary">
          Raised {formatDateTime(complaint.created_at)}
        </Text>
        <Text variant="body">{complaint.description}</Text>
      </Card>

      <StatusTimeline status={complaint.status} />
      {canClose && (
        <Card className="gap-md">
          <Text variant="body" color="textSecondary">
            {closeMessage}
          </Text>
          <Button label="Close ticket" icon="check_circle" loading={closeComplaint.isPending} onPress={handleClose} />
        </Card>
      )}
      <PhotoGrid photos={complaint.photos} />
      {assigneeLabel && (
        <Card>
          <Text variant="caption" color="textSecondary">
            ASSIGNED TO
          </Text>
          <Text variant="body">{assigneeLabel}</Text>
        </Card>
      )}
      <CommentThread complaintId={complaint.id} updates={updates} />
    </>
  );

  if (embedded) return content;

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      {content}
    </Screen>
  );
}
