
import { View } from 'react-native';
import { alertConfirm, alertError, alertSuccess } from '@/lib/alert';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button, Card, Screen, ScreenLoading, Text } from '@/components';
import { FlatForm, type FlatFormValues } from '@/features/admin/FlatForm';
import { useFlatInvites, useRevokeFlatInvite } from '@/queries/useAdminResidents';
import { useDeleteFlat, useFlat, useUpsertFlat } from '@/queries/useTowers';

export default function AdminFlatDetailScreen() {
  const { t } = useTranslation();
  const { towerId, flatId } = useLocalSearchParams<{ towerId: string; flatId: string }>();
  const { data: flat, isLoading } = useFlat(flatId);
  const { data: pendingInvites = [] } = useFlatInvites(flatId);
  const upsertFlat = useUpsertFlat();
  const deleteFlat = useDeleteFlat();
  const revokeInvite = useRevokeFlatInvite();

  if (isLoading || !flat) return <ScreenLoading variant="tab" />;

  const save = async (values: FlatFormValues) => {
    try {
      await upsertFlat.mutateAsync({
        bhk: values.bhk ?? null,
        floor: values.floor ?? null,
        id: flat.id,
        number: values.number,
        tower_id: towerId,
      });
      alertSuccess(t('alert.titles.flatUpdated'));
    } catch (error) {
      alertError(t('alert.titles.updateFailed'), error);
    }
  };

  const remove = () => {
    alertConfirm(t('alert.titles.deleteFlat'), t('alert.messages.deleteFlatReferences'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteFlat.mutateAsync(flat.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <Screen scroll variant="tab">
      <FlatForm flat={flat} loading={upsertFlat.isPending} onSubmit={save} />

      <Card className="gap-md">
        <View className="flex-row items-center justify-between">
          <Text variant="headline">{t('admin.society.pendingInvites')}</Text>
          <Button
            label={t('admin.society.inviteToFlat')}
            size="sm"
            variant="tonal"
            icon="person_add"
            onPress={() => router.push({ pathname: '/(admin)/(society)/invite' as any, params: { flatId: flat.id, flatLabel: flat.number } })}
          />
        </View>
        {pendingInvites.map((invite) => (
          <View key={invite.id} className="flex-row items-center justify-between gap-md">
            <View className="flex-1">
              <Text variant="body">{invite.name || invite.email}</Text>
              <Text variant="caption" color="textSecondary">
                {invite.email} {invite.relation ? `· ${invite.relation}` : ''}
              </Text>
            </View>
            <Button
              label={t('admin.society.revokeInvite')}
              size="sm"
              variant="text"
              loading={revokeInvite.isPending}
              onPress={() => revokeInvite.mutate(invite.id)}
            />
          </View>
        ))}
        {!pendingInvites.length && (
          <Text variant="body" color="textSecondary">
            {t('admin.society.noPendingInvites')}
          </Text>
        )}
      </Card>

      <Button label={`${t('common.delete')} ${t('nav.screens.flat').toLowerCase()}`} variant="danger" icon="delete" loading={deleteFlat.isPending} onPress={remove} />
    </Screen>
  );
}

