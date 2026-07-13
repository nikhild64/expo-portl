import { Linking, Pressable, Share, View } from 'react-native';
import { alert } from '@/lib/alert';
import { ScopedTheme } from 'uniwind';
import { useTranslation } from 'react-i18next';

import { Avatar, Button, EmptyState, IconSymbol, Screen, ScreenEmpty, ScreenLoading, SkeletonCard, StatusPill, Text } from '@/components';
import { formatFlatLabel, formatRelativeTime, formatTicketNumber, titleize } from '@/lib/format';
import { useCloseComplaint, useComplaint, useComplaintUpdates } from '@/queries/useComplaints';
import { useRealtimeTable } from '@/queries/useRealtimeTable';
import { useAuthStore } from '@/stores/authStore';

import { COMPLAINT_CATEGORY_ICONS, COMPLAINT_CATEGORIES } from './constants';
import { CommentInputBar, CommentThread } from './CommentThread';
import { PhotoGrid } from './PhotoGrid';
import { StatusTimeline } from './StatusTimeline';

interface Props {
  complaintId?: string;
  embedded?: boolean;
}

export function ComplaintDetail({ complaintId, embedded = false }: Props) {
  const { t } = useTranslation();
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
      title: t('resident.complaints.complaintNotFound'),
      subtitle: t('resident.complaints.complaintRemoved'),
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
      ? t('resident.complaints.teamSuffix', { category: titleize(assignedProvider.category) })
      : null;
  const raisedByName = complaint.raised_by_profile?.full_name ?? t('nav.screens.resident');
  const flatLabel = formatFlatLabel(complaint.flat?.towers?.name, complaint.flat?.number, '');
  const categoryIcon = COMPLAINT_CATEGORY_ICONS[complaint.category as keyof typeof COMPLAINT_CATEGORY_ICONS] ?? 'info';
  const canClose = !embedded && complaint.raised_by === uid && complaint.status !== 'closed';
  const closeMessage =
    complaint.status === 'resolved'
      ? t('resident.complaints.closeResolvedMsg')
      : t('resident.complaints.closeGeneralMsg');

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
      alert(t('alert.titles.noPhoneNumber'), t('alert.messages.noPhoneShared'));
      return;
    }
    Linking.openURL(`tel:${assigneePhone}`);
  };

  const messageAssignee = () => {
    if (!assigneePhone) {
      alert(t('alert.titles.noPhoneNumber'), t('alert.messages.noPhoneShared'));
      return;
    }
    Linking.openURL(`sms:${assigneePhone}`);
  };

  const handleClose = () => {
    alert(t('alert.titles.closeTicket'), t('alert.messages.markTicketClosed'), [
      { style: 'cancel', text: t('common.cancel') },
      {
        text: t('alert.buttons.closeTicket'),
        onPress: async () => {
          try {
            await closeComplaint.mutateAsync(complaint.id);
          } catch (closeError) {
            alert(
              t('alert.titles.couldNotCloseTicket'),
              closeError instanceof Error ? closeError.message : t('common.pleaseTryAgain'),
            );
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
          <Text variant="headline">{t('common.ticketNumber', { number: formatTicketNumber(complaint.id) })}</Text>
          <Pressable onPress={shareTicket} accessibilityRole="button" accessibilityLabel={t('a11y.shareTicket')} className="p-sm">
            <IconSymbol name="share" size={22} color="textPrimary" />
          </Pressable>
        </View>

        <View className="gap-sm">
          <Text variant="titleLarge">{complaint.title}</Text>
          <View className="flex-row flex-wrap gap-sm">
            <View className="flex-row items-center gap-xs rounded-pill bg-surface-secondary px-md py-sm">
              <IconSymbol name={categoryIcon} size={14} color="coral" />
              <Text variant="caption" color="textSecondary">
                {t(`resident.complaints.categories.${complaint.category as (typeof COMPLAINT_CATEGORIES)[number]}`)}
              </Text>
            </View>
            {complaint.priority === 'urgent' || complaint.priority === 'high' ? (
              <StatusPill
                tone={priorityTone}
                label={complaint.priority === 'urgent' ? t('resident.complaints.urgent') : t('resident.complaints.highPriority')}
              />
            ) : null}
          </View>
          <Text variant="footnote" color="textSecondary">
            {t('resident.complaints.raisedBy', { name: raisedByName })}
            {flatLabel ? ` (${flatLabel})` : ''} • {formatRelativeTime(complaint.created_at)}
          </Text>
        </View>

        <StatusTimeline
          status={complaint.status}
          createdAt={complaint.created_at}
          resolvedAt={complaint.resolved_at}
          updates={updates}
          dark
        />

        <View className="gap-sm">
          <Text variant="caption" color="textSecondary">
            {t('common.description').toUpperCase()}
          </Text>
          <Text variant="body">{complaint.description}</Text>
        </View>

        <PhotoGrid photos={complaint.photos} dark />

        {assigneeName ? (
          <View className="gap-md rounded-md bg-surface-secondary p-base">
            <Text variant="caption" color="textSecondary">
              {t('resident.complaints.assignedTo')}
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
              <Button label={t('resident.complaints.call')} variant="outlined" icon="phone" full className="flex-1" onPress={callAssignee} />
              <Button label={t('resident.complaints.message')} variant="outlined" icon="message" full className="flex-1" onPress={messageAssignee} />
            </View>
          </View>
        ) : null}

        {canClose ? (
          <View className="gap-md rounded-md bg-surface-secondary p-base">
            <Text variant="body" color="textSecondary">
              {closeMessage}
            </Text>
            <Button label={t('resident.complaints.closeTicket')} icon="check_circle" loading={closeComplaint.isPending} onPress={handleClose} />
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
