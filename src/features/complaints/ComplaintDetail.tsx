import { Card, EmptyState, Screen, ScreenEmpty, ScreenLoading, SkeletonCard, Text } from '@/components';
import { formatDateTime, titleize } from '@/lib/format';
import { useComplaint, useComplaintUpdates } from '@/queries/useComplaints';
import { useRealtimeTable } from '@/queries/useRealtimeTable';

import { CommentThread } from './CommentThread';
import { PhotoGrid } from './PhotoGrid';
import { StatusTimeline } from './StatusTimeline';

interface Props {
  complaintId?: string;
  embedded?: boolean;
}

export function ComplaintDetail({ complaintId, embedded = false }: Props) {
  const { data: complaint, isLoading, error } = useComplaint(complaintId);
  const { data: updates = [] } = useComplaintUpdates(complaintId);

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
