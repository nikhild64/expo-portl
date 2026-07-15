import { View } from 'react-native';
import { alertError, alertSuccess, alertWarning } from '@/lib/alert';
import { useTranslation } from 'react-i18next';

import { Button, Card, EmptyState, Screen, ScreenLoading, Text } from '@/components';
import { formatDate, formatFlatLabel, formatMoney } from '@/lib/format';
import { useDefaulters, useSendAllPaymentReminders, useSendPaymentReminder } from '@/queries/useDuesAdmin';
import { useAuthStore } from '@/stores/authStore';

export default function AdminDefaultersScreen() {
  const { t } = useTranslation();
  const societyId = useAuthStore((s) => s.profile?.society_id);
  const { data: dues = [], isLoading } = useDefaulters(societyId);
  const sendReminder = useSendPaymentReminder();
  const sendAllReminders = useSendAllPaymentReminders();

  if (isLoading) return <ScreenLoading variant="tab" />;

  const remind = async (dueId: string, profileId?: string) => {
    if (!profileId) {
      alertWarning(t('alert.titles.noResidentLinked'), t('alert.messages.noResidentProfile'));
      return;
    }
    try {
      await sendReminder.mutateAsync({ dueId, profileId });
      alertSuccess(t('alert.titles.reminderQueued'));
    } catch (error) {
      alertError(t('alert.titles.updateFailed'), error);
    }
  };

  const remindAll = async () => {
    const targets = dues.flatMap((due) => {
      const profileId = due.flat_residents?.[0]?.profile_id;
      return profileId ? [{ dueId: due.id, profileId }] : [];
    });

    if (!targets.length) {
      alertWarning(t('alert.titles.noResidentLinked'), t('alert.messages.noRemindersToSend'));
      return;
    }

    try {
      const sent = await sendAllReminders.mutateAsync(targets);
      alertSuccess(t('alert.titles.remindersQueued'), t('alert.messages.remindersQueued', { count: sent }));
    } catch (error) {
      alertError(t('alert.titles.updateFailed'), error);
    }
  };

  return (
    <Screen scroll variant="tab">
      {dues.length > 0 ? (
        <Button
          label={t('admin.ops.sendReminderToAll')}
          icon="notifications"
          loading={sendAllReminders.isPending}
          disabled={sendReminder.isPending}
          onPress={remindAll}
        />
      ) : null}
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
