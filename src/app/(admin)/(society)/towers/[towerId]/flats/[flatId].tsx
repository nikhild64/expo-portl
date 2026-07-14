
import { alertConfirm, alertError, alertSuccess } from '@/lib/alert';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button, Screen, ScreenLoading } from '@/components';
import { FlatForm, type FlatFormValues } from '@/features/admin/FlatForm';
import { useDeleteFlat, useFlat, useUpsertFlat } from '@/queries/useTowers';

export default function AdminFlatDetailScreen() {
  const { t } = useTranslation();
  const { towerId, flatId } = useLocalSearchParams<{ towerId: string; flatId: string }>();
  const { data: flat, isLoading } = useFlat(flatId);
  const upsertFlat = useUpsertFlat();
  const deleteFlat = useDeleteFlat();

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
      <Button label={`${t('common.delete')} ${t('nav.screens.flat').toLowerCase()}`} variant="danger" icon="delete" loading={deleteFlat.isPending} onPress={remove} />
    </Screen>
  );
}
