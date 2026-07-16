
import { useState } from 'react';
import { View } from 'react-native';
import { alertError, alertSuccess } from '@/lib/alert';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button, Card, EmptyState, ListRow, Screen, ScreenLoading } from '@/components';
import { TowerForm, type TowerFormValues } from '@/features/admin/TowerForm';
import { useTowers, useUpsertTower } from '@/queries/useTowers';
import { useAuthStore } from '@/stores/authStore';

export default function AdminTowersScreen() {
  const { t } = useTranslation();
  const [adding, setAdding] = useState(false);
  const societyId = useAuthStore((s) => s.profile?.society_id);
  const { data: towers = [], isLoading } = useTowers(societyId);
  const upsertTower = useUpsertTower();

  const createTower = async (values: TowerFormValues) => {
    if (!societyId) return;
    try {
      await upsertTower.mutateAsync({ name: values.name, society_id: societyId, sort_order: values.sortOrder ?? 0 });
      alertSuccess(t('alert.titles.towerSaved'), t('alert.messages.towerAvailable'));
      setAdding(false);
    } catch (error) {
      alertError(t('alert.titles.saveFailed'), error);
    }
  };

  if (isLoading) return <ScreenLoading variant="tab" />;

  return (
    <Screen scroll variant="tab">
      {adding ? (
        <View className="gap-sm">
          <TowerForm key={towers.length} defaultSortOrder={towers.length + 1} loading={upsertTower.isPending} onSubmit={createTower} />
          <Button label={t('common.cancel')} variant="text" onPress={() => setAdding(false)} />
        </View>
      ) : (
        <Button label={t('admin.society.addTower')} icon="add" variant="tonal" onPress={() => setAdding(true)} />
      )}
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
