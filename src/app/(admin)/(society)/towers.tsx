import { Alert } from 'react-native';
import { router, type Href } from 'expo-router';

import { Card, EmptyState, ListRow, Screen, SkeletonCard, Text } from '@/components';
import { TowerForm, type TowerFormValues } from '@/features/admin/TowerForm';
import { useTowers, useUpsertTower } from '@/queries/useTowers';
import { useAuthStore } from '@/stores/authStore';

export default function AdminTowersScreen() {
  const societyId = useAuthStore((s) => s.profile?.society_id);
  const { data: towers = [], isLoading } = useTowers(societyId);
  const upsertTower = useUpsertTower();

  const createTower = async (values: TowerFormValues) => {
    if (!societyId) return;
    try {
      await upsertTower.mutateAsync({ name: values.name, society_id: societyId, sort_order: values.sortOrder ?? 0 });
      Alert.alert('Tower saved', 'Tower is available for flats and residents.');
    } catch (error) {
      Alert.alert('Save failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  if (isLoading) return <SkeletonCard />;

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <TowerForm loading={upsertTower.isPending} onSubmit={createTower} />
      <Card padding="none" className="overflow-hidden">
        {towers.map((tower) => (
          <ListRow
            key={tower.id}
            title={`Tower ${tower.name}`}
            subtitle={`Sort order ${tower.sort_order}`}
            showChevron
            onPress={() => router.push(`/(admin)/(society)/towers/${tower.id}` as Href)}
          />
        ))}
        {!towers.length && <EmptyState icon="apartment" title="No towers yet" subtitle="Add the first tower above." />}
      </Card>
      <Text variant="footnote" color="textTertiary">
        Tower CRUD is society-scoped through existing admin RLS policies.
      </Text>
    </Screen>
  );
}
