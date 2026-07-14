
import { alertConfirm, alertError, alertSuccess } from '@/lib/alert';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button, Card, ListRow, Screen, ScreenLoading, Text } from '@/components';
import { TowerForm, type TowerFormValues } from '@/features/admin/TowerForm';
import { useDeleteTower, useTower, useUpsertTower } from '@/queries/useTowers';

export default function AdminTowerDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: tower, isLoading } = useTower(id);
  const upsertTower = useUpsertTower();
  const deleteTower = useDeleteTower();

  if (isLoading || !tower) return <ScreenLoading variant="tab" />;

  const flatCount = tower.flats?.length ?? 0;

  const save = async (values: TowerFormValues) => {
    try {
      await upsertTower.mutateAsync({ id: tower.id, name: values.name, sort_order: values.sortOrder ?? 0 });
      alertSuccess(t('alert.titles.towerUpdated'));
    } catch (error) {
      alertError(t('alert.titles.updateFailed'), error);
    }
  };

  const remove = () => {
    alertConfirm(t('alert.titles.deleteTower'), t('alert.messages.deleteFlatsFirst'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteTower.mutateAsync(tower.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <Screen scroll variant="tab">
      <TowerForm tower={tower} loading={upsertTower.isPending} onSubmit={save} />
      <Card padding="none" className="overflow-hidden">
        <ListRow
          title={t('admin.society.manageFlats')}
          subtitle={t('admin.society.flatsInTower', { count: flatCount })}
          showChevron
          onPress={() =>
            router.push({
              pathname: '/(admin)/(society)/towers/[id]/flats',
              params: { id: tower.id },
            })
          }
        />
      </Card>
      <Button label={`${t('common.delete')} ${t('nav.screens.tower').toLowerCase()}`} variant="danger" icon="delete" loading={deleteTower.isPending} onPress={remove} />
      <Text variant="footnote" color="textTertiary">
        {t('admin.society.deleteTowerNote')}
      </Text>
    </Screen>
  );
}
