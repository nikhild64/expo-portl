
import { alert } from '@/lib/alert';
import { useLocalSearchParams, router, type Href } from 'expo-router';

import { Button, Card, ListRow, Screen, ScreenLoading, Text } from '@/components';
import { TowerForm, type TowerFormValues } from '@/features/admin/TowerForm';
import { useDeleteTower, useTower, useUpsertTower } from '@/queries/useTowers';

export default function AdminTowerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: tower, isLoading } = useTower(id);
  const upsertTower = useUpsertTower();
  const deleteTower = useDeleteTower();

  if (isLoading || !tower) return <ScreenLoading safe={false} />;

  const save = async (values: TowerFormValues) => {
    try {
      await upsertTower.mutateAsync({ id: tower.id, name: values.name, sort_order: values.sortOrder ?? 0 });
      alert('Tower updated');
    } catch (error) {
      alert('Update failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const remove = () => {
    alert('Delete tower?', 'Delete flats first if this tower is in use.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteTower.mutateAsync(tower.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <TowerForm tower={tower} loading={upsertTower.isPending} onSubmit={save} />
      <Card padding="none" className="overflow-hidden">
        <ListRow
          title="Manage flats"
          subtitle={`${tower.flats?.length ?? 0} flat${tower.flats?.length === 1 ? '' : 's'} in this tower`}
          showChevron
          onPress={() =>
            router.push({
              pathname: '/(admin)/(society)/towers/[id]/flats',
              params: { id: tower.id },
            })
          }
        />
      </Card>
      <Button label="Delete tower" variant="danger" icon="delete" loading={deleteTower.isPending} onPress={remove} />
      <Text variant="footnote" color="textTertiary">
        If delete fails, remove linked flats and residents first.
      </Text>
    </Screen>
  );
}
