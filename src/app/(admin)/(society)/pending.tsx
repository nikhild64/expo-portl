import { View } from 'react-native';
import { alert } from '@/lib/alert';

import { Button, Card, EmptyState, Screen, ScreenLoading, Text } from '@/components';
import { formatDateTime, formatFlatLabel } from '@/lib/format';
import { useApproveResident, usePendingResidents, useRejectResident } from '@/queries/usePendingResidents';
import { useAuthStore } from '@/stores/authStore';

export default function PendingResidentsScreen() {
  const societyId = useAuthStore((s) => s.profile?.society_id);
  const { data: residents = [], isLoading } = usePendingResidents(societyId);
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
      {!residents.length && <EmptyState icon="verified_user" title="No pending residents" subtitle="New join requests appear here." />}
      {residents.map((resident) => {
        const flatLabel = resident.flat_residents
          ?.map((link) => formatFlatLabel(link.flats?.towers?.name, link.flats?.number, link.flat_id))
          .join(', ');
        return (
          <Card key={resident.id} className="gap-md">
            <View>
              <Text variant="title">{resident.full_name}</Text>
              <Text variant="footnote" color="textSecondary">
                Requested {formatDateTime(resident.created_at)}
              </Text>
              <Text variant="body" color="textSecondary">
                {flatLabel || 'No flat requested'}
              </Text>
            </View>
            <View className="flex-row gap-md">
              <Button label="Approve" icon="check_circle" full loading={approve.isPending} onPress={() => approve.mutate(resident.id)} />
              <Button label="Reject" icon="cancel" full variant="outlined" loading={reject.isPending} onPress={() => rejectResident(resident.id)} />
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}
