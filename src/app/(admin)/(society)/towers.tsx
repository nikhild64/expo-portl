
import { alert } from '@/lib/alert';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Card, EmptyState, ListRow, Screen, ScreenLoading, Text } from '@/components';
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
      alert(t('alert.titles.towerSaved'), t('alert.messages.towerAvailable'));
    } catch (error) {
      alert(t('alert.titles.saveFailed'), error instanceof Error ? error.message : t('common.pleaseTryAgain'));
    }
  };

  if (isLoading) return <ScreenLoading safe={false} />;

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <TowerForm loading={upsertTower.isPending} onSubmit={createTower} />
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
      <Text variant="footnote" color="textTertiary">
        {t('admin.society.towerCrudNote')}
      </Text>
    </Screen>
  );
}
