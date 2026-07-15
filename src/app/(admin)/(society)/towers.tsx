
import { alertError, alertSuccess } from '@/lib/alert';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Card, EmptyState, ListRow, Screen, ScreenLoading } from '@/components';
import { TowerForm, type TowerFormValues } from '@/features/admin/TowerForm';
import { useTowers, useUpsertTower } from '@/queries/useTowers';
import { useAuthStore } from '@/stores/authStore';

export default function AdminTowersScreen() {
  const { t } = useTranslation();
  const societyId = useAuthStore((s) => s.profile?.society_id);
  const { data: towers = [], isLoading } = useTowers(societyId);
  const upsertTower = useUpsertTower();

  const createTower = async (values: TowerFormValues) => {
    if (!societyId) return;
    try {
      await upsertTower.mutateAsync({ name: values.name, society_id: societyId, sort_order: values.sortOrder ?? 0 });
      alertSuccess(t('alert.titles.towerSaved'), t('alert.messages.towerAvailable'));
    } catch (error) {
      alertError(t('alert.titles.saveFailed'), error);
    }
  };

  if (isLoading) return <ScreenLoading variant="tab" />;

  return (
    <Screen scroll variant="tab">
      <TowerForm key={towers.length} defaultSortOrder={towers.length} loading={upsertTower.isPending} onSubmit={createTower} />
      <Card padding="none" className="overflow-hidden">
        {towers.map((tower) => (
          <ListRow
            key={tower.id}
            title={`${t('nav.screens.tower')} ${tower.name}`}
            subtitle={`${t('admin.society.sortOrder')} ${tower.sort_order}`}
            showChevron
            onPress={() => router.push(`/(admin)/(society)/towers/${tower.id}`)}
          />
        ))}
        {!towers.length && <EmptyState icon="apartment" title={t('admin.society.noTowers')} subtitle={t('admin.society.noTowersSub')} />}
      </Card>
    </Screen>
  );
}
