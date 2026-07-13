import { View } from 'react-native';
import { alert } from '@/lib/alert';
import { useTranslation } from 'react-i18next';

import { Button, Card, EmptyState, Screen, ScreenLoading, Text } from '@/components';
import { formatDate, formatFlatLabel, formatMoney } from '@/lib/format';
import { useDefaulters, useSendPaymentReminder } from '@/queries/useDuesAdmin';
import { useAuthStore } from '@/stores/authStore';

export default function AdminDefaultersScreen() {
  const { t } = useTranslation();
  const societyId = useAuthStore((s) => s.profile?.society_id);
  const { data: dues = [], isLoading } = useDefaulters(societyId);
  const sendReminder = useSendPaymentReminder();

  if (isLoading) return <ScreenLoading safe={false} />;

  const remind = async (dueId: string, profileId?: string) => {
    if (!profileId) {
      alert(t('alert.titles.noResidentLinked'), t('alert.messages.noResidentProfile'));
      return;
    }
    await sendReminder.mutateAsync({ dueId, profileId });
    alert(t('alert.titles.reminderQueued'));
  };

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      {!dues.length && <EmptyState icon="check_circle" title={t('admin.ops.noDefaulters')} subtitle={t('admin.ops.noDefaultersSub')} />}
      {dues.map((due) => {
        const resident = due.flat_residents?.[0];
        return (
          <Card key={due.id} className="gap-md">
            <View>
              <Text variant="title">
                {formatFlatLabel(due.flats?.towers?.name, due.flats?.number, due.flat_id)}
              </Text>
              <Text variant="body" color="textSecondary">
                {resident?.profiles?.full_name ?? t('status.notLinked')} - {t('status.due')} {formatDate(due.due_date)}
              </Text>
              <Text variant="titleLarge">{formatMoney(due.total)}</Text>
            </View>
            <Button label={t('admin.ops.sendReminder')} variant="tonal" icon="notifications" loading={sendReminder.isPending} onPress={() => remind(due.id, resident?.profile_id)} />
          </Card>
        );
      })}
    </Screen>
  );
}
