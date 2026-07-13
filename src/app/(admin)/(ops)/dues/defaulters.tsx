import { Alert, View } from 'react-native';

import { Button, Card, EmptyState, Screen, ScreenLoading, Text } from '@/components';
import { formatDate, formatFlatLabel, formatMoney } from '@/lib/format';
import { useDefaulters, useSendPaymentReminder } from '@/queries/useDuesAdmin';
import { useAuthStore } from '@/stores/authStore';

export default function AdminDefaultersScreen() {
  const societyId = useAuthStore((s) => s.profile?.society_id);
  const { data: dues = [], isLoading } = useDefaulters(societyId);
  const sendReminder = useSendPaymentReminder();

  if (isLoading) return <ScreenLoading safe={false} />;

  const remind = async (dueId: string, profileId?: string) => {
    if (!profileId) {
      Alert.alert('No resident linked', 'This flat has no linked resident profile.');
      return;
    }
    await sendReminder.mutateAsync({ dueId, profileId });
    Alert.alert('Reminder queued');
  };

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      {!dues.length && <EmptyState icon="check_circle" title="No defaulters" subtitle="All overdue dues are clear." />}
      {dues.map((due) => {
        const resident = due.flat_residents?.[0];
        return (
          <Card key={due.id} className="gap-md">
            <View>
              <Text variant="title">
                {formatFlatLabel(due.flats?.towers?.name, due.flats?.number, due.flat_id)}
              </Text>
              <Text variant="body" color="textSecondary">
                {resident?.profiles?.full_name ?? 'No resident linked'} - Due {formatDate(due.due_date)}
              </Text>
              <Text variant="titleLarge">{formatMoney(due.total)}</Text>
            </View>
            <Button label="Send reminder" variant="tonal" icon="notifications" loading={sendReminder.isPending} onPress={() => remind(due.id, resident?.profile_id)} />
          </Card>
        );
      })}
    </Screen>
  );
}
