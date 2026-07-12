import { useLocalSearchParams } from 'expo-router';

import { Card, EmptyState, Screen, SkeletonCard, Text } from '@/components';
import { CommentThread } from '@/features/complaints/CommentThread';
import { PhotoGrid } from '@/features/complaints/PhotoGrid';
import { StatusTimeline } from '@/features/complaints/StatusTimeline';
import { formatDateTime, titleize } from '@/lib/format';
import { useComplaint, useComplaintUpdates } from '@/queries/useComplaints';

export default function ComplaintDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: complaint, isLoading, error } = useComplaint(id);
  const { data: updates = [] } = useComplaintUpdates(id);

  if (isLoading) return <SkeletonCard />;

  if (error || !complaint) {
    return <EmptyState icon="error_outline" title="Complaint not found" subtitle="This complaint may have been removed." />;
  }

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
      {complaint.assigned_to && (
        <Card>
          <Text variant="caption" color="textSecondary">
            ASSIGNED TO
          </Text>
          <Text variant="body">{complaint.assigned_to}</Text>
        </Card>
      )}
      <CommentThread complaintId={complaint.id} updates={updates} />
    </Screen>
  );
}
