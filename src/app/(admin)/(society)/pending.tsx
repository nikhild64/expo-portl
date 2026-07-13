import { View } from 'react-native';
import { alert } from '@/lib/alert';

import { Button, Card, EmptyState, Screen, ScreenLoading, StatusPill, Text } from '@/components';
import { formatDateTime, formatFlatLabel, titleize } from '@/lib/format';
import { useApproveResident, usePendingApprovals, useRejectResident } from '@/queries/usePendingResidents';
import { useAuthStore } from '@/stores/authStore';

export default function PendingResidentsScreen() {
  const societyId = useAuthStore((s) => s.profile?.society_id);
  const { data: residents = [], isLoading } = usePendingApprovals(societyId);
  const approve = useApproveResident();
  const reject = useRejectResident();

  if (isLoading) return <ScreenLoading safe={false} />;

  const rejectResident = (profileId: string) => {
    alert('Reject request?', 'This blocks the profile and removes any requested flat links.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: () => reject.mutate(profileId) },
    ]);
  };

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      {!residents.length && (
        <EmptyState icon="verified_user" title="No pending requests" subtitle="New resident and guard requests appear here." />
      )}
      {residents.map((resident) => {
        const flatLabel = resident.flat_residents
          ?.map((link) => formatFlatLabel(link.flats?.towers?.name, link.flats?.number, link.flat_id))
          .join(', ');
        return (
          <Card key={resident.id} className="gap-md">
            <View>
              <View className="flex-row items-center gap-sm">
                <Text variant="title">{resident.full_name}</Text>
                <StatusPill tone="neutral" label={titleize(resident.role)} />
              </View>
              <Text variant="footnote" color="textSecondary">
                Requested {formatDateTime(resident.created_at)}
              </Text>
              <Text variant="body" color="textSecondary">
                {resident.role === 'guard'
                  ? 'Guard access request'
                  : flatLabel || 'No flat requested'}
              </Text>
            </View>
            <View className="flex-row gap-md">
              <Button label="Approve" icon="check_circle" full className="flex-1" loading={approve.isPending} onPress={() => approve.mutate(resident.id)} />
              <Button label="Reject" icon="cancel" full variant="outlined" className="flex-1" loading={reject.isPending} onPress={() => rejectResident(resident.id)} />
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}
