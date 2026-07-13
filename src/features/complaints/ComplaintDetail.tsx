import { Alert, Linking, Pressable, Share, View } from 'react-native';
import { ScopedTheme } from 'uniwind';

import { Avatar, Button, EmptyState, IconSymbol, Screen, ScreenEmpty, ScreenLoading, SkeletonCard, StatusPill, Text } from '@/components';
import { formatFlatLabel, formatRelativeTime, formatTicketNumber, titleize } from '@/lib/format';
import { useCloseComplaint, useComplaint, useComplaintUpdates } from '@/queries/useComplaints';
import { useRealtimeTable } from '@/queries/useRealtimeTable';
import { useAuthStore } from '@/stores/authStore';

import { COMPLAINT_CATEGORY_ICONS } from './constants';
import { CommentInputBar, CommentThread } from './CommentThread';
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

  const assignedProfile =
    typeof complaint.assigned === 'object' && complaint.assigned ? complaint.assigned : null;
  const assignedProvider =
    typeof complaint.assigned_service_provider === 'object' && complaint.assigned_service_provider
      ? complaint.assigned_service_provider
      : null;
  const assigneeName = assignedProfile?.full_name ?? assignedProvider?.name ?? null;
  const assigneePhone = assignedProfile?.phone ?? assignedProvider?.phone ?? null;
  const assigneeRole = assignedProfile
    ? titleize(assignedProfile.role)
    : assignedProvider
      ? `${titleize(assignedProvider.category)} team`
      : null;
  const raisedByName = complaint.raised_by_profile?.full_name ?? 'Resident';
  const flatLabel = formatFlatLabel(complaint.flat?.towers?.name, complaint.flat?.number, '');
  const categoryIcon = COMPLAINT_CATEGORY_ICONS[complaint.category as keyof typeof COMPLAINT_CATEGORY_ICONS] ?? 'info';
  const canClose = !embedded && complaint.raised_by === uid && complaint.status !== 'closed';
  const closeMessage =
    complaint.status === 'resolved'
      ? 'This issue has been marked resolved. Close the ticket if you are satisfied with the outcome.'
      : 'Close this ticket if the issue is fixed or no longer needs attention.';

  const shareTicket = async () => {
    try {
      await Share.share({
        message: `${formatTicketNumber(complaint.id)} — ${complaint.title}\n${complaint.description}`,
      });
    } catch {
      // User dismissed share sheet.
    }
  };

  const callAssignee = () => {
    if (!assigneePhone) {
      Alert.alert('No phone number', 'This assignee has not shared a phone number.');
      return;
    }
    Linking.openURL(`tel:${assigneePhone}`);
  };

  const messageAssignee = () => {
    if (!assigneePhone) {
      Alert.alert('No phone number', 'This assignee has not shared a phone number.');
      return;
    }
    Linking.openURL(`sms:${assigneePhone}`);
  };

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

  const priorityTone =
    complaint.priority === 'urgent' ? 'danger' : complaint.priority === 'high' ? 'warning' : 'info';

  const content = (
    <ScopedTheme theme="dark">
      <View className="gap-lg rounded-lg bg-bg p-base">
        <View className="flex-row items-center justify-between">
          <Text variant="headline">Ticket {formatTicketNumber(complaint.id)}</Text>
          <Pressable onPress={shareTicket} accessibilityRole="button" accessibilityLabel="Share ticket" className="p-sm">
            <IconSymbol name="share" size={22} color="textPrimary" />
          </Pressable>
        </View>

        <View className="gap-sm">
          <Text variant="titleLarge">{complaint.title}</Text>
          <View className="flex-row flex-wrap gap-sm">
            <View className="flex-row items-center gap-xs rounded-pill bg-surface-secondary px-md py-sm">
              <IconSymbol name={categoryIcon} size={14} color="coral" />
              <Text variant="caption" color="textSecondary">
                {titleize(complaint.category)}
              </Text>
            </View>
            {complaint.priority === 'urgent' || complaint.priority === 'high' ? (
              <StatusPill tone={priorityTone} label={complaint.priority === 'urgent' ? 'URGENT' : 'High priority'} />
            ) : null}
          </View>
          <Text variant="footnote" color="textSecondary">
            Raised by {raisedByName}
            {flatLabel ? ` (${flatLabel})` : ''} • {formatRelativeTime(complaint.created_at)}
          </Text>
        </View>

        <StatusTimeline
          status={complaint.status}
          createdAt={complaint.created_at}
          resolvedAt={complaint.resolved_at}
          assigneeName={assigneeName}
          updates={updates}
          dark
        />

        <View className="gap-sm">
          <Text variant="caption" color="textSecondary">
            DESCRIPTION
          </Text>
          <Text variant="body">{complaint.description}</Text>
        </View>

        <PhotoGrid photos={complaint.photos} dark />

        {assigneeName ? (
          <View className="gap-md rounded-md bg-surface-secondary p-base">
            <Text variant="caption" color="textSecondary">
              ASSIGNED TO
            </Text>
            <View className="flex-row items-center gap-md">
              <Avatar name={assigneeName} uri={assignedProfile?.avatar_url ?? undefined} size="lg" />
              <View className="flex-1 gap-xs">
                <Text variant="headline">{assigneeName}</Text>
                {assigneeRole ? (
                  <Text variant="footnote" color="textSecondary">
                    {assigneeRole}
                  </Text>
                ) : null}
              </View>
            </View>
            <View className="flex-row gap-sm">
              <Button label="Call" variant="outlined" icon="phone" full onPress={callAssignee} />
              <Button label="Message" variant="outlined" icon="message" full onPress={messageAssignee} />
            </View>
          </View>
        ) : null}

        {canClose ? (
          <View className="gap-md rounded-md bg-surface-secondary p-base">
            <Text variant="body" color="textSecondary">
              {closeMessage}
            </Text>
            <Button label="Close ticket" icon="check_circle" loading={closeComplaint.isPending} onPress={handleClose} />
          </View>
        ) : null}

        <CommentThread complaintId={complaint.id} updates={updates} dark showInput={embedded} />
      </View>
    </ScopedTheme>
  );

  if (embedded) return content;

  return (
    <View className="flex-1">
      <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}>
        {content}
      </Screen>
      <CommentInputBar complaintId={complaint.id} dark />
    </View>
  );
}
