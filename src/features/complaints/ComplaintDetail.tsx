import { Card, EmptyState, Screen, SkeletonCard, Text } from '@/components';
import { formatDateTime, titleize } from '@/lib/format';
import { useComplaint, useComplaintUpdates } from '@/queries/useComplaints';
import { useRealtimeTable } from '@/queries/useRealtimeTable';

import { CommentThread } from './CommentThread';
import { PhotoGrid } from './PhotoGrid';
import { StatusTimeline } from './StatusTimeline';

interface Props {
  complaintId?: string;
}

export function ComplaintDetail({ complaintId }: Props) {
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

  if (isLoading) return <SkeletonCard />;

  if (error || !complaint) {
    return <EmptyState icon="error_outline" title="Complaint not found" subtitle="This complaint may have been removed." />;
  }

  const assignedName = typeof complaint.assigned === 'object' && complaint.assigned ? complaint.assigned.full_name : null;

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
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
      {(assignedName || complaint.assigned_to) && (
        <Card>
          <Text variant="caption" color="textSecondary">
            ASSIGNED TO
          </Text>
          <Text variant="body">{assignedName ?? complaint.assigned_to}</Text>
        </Card>
      )}
      <CommentThread complaintId={complaint.id} updates={updates} />
    </Screen>
  );
}
