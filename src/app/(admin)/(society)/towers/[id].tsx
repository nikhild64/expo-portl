import { Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

import { Button, Card, ListRow, Screen, SkeletonCard, Text } from '@/components';
import { TowerForm, type TowerFormValues } from '@/features/admin/TowerForm';
import { useDeleteTower, useTower, useUpsertTower } from '@/queries/useTowers';

export default function AdminTowerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: tower, isLoading } = useTower(id);
  const upsertTower = useUpsertTower();
  const deleteTower = useDeleteTower();

  if (isLoading || !tower) return <SkeletonCard />;

  const save = async (values: TowerFormValues) => {
    try {
      await upsertTower.mutateAsync({ id: tower.id, name: values.name, sort_order: values.sortOrder ?? 0 });
      Alert.alert('Tower updated');
    } catch (error) {
      Alert.alert('Update failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const remove = () => {
    Alert.alert('Delete tower?', 'Delete flats first if this tower is in use.', [
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
          onPress={() => router.push(`/(admin)/(society)/towers/${tower.id}/flats` as never)}
        />
      </Card>
      <Button label="Delete tower" variant="danger" icon="delete" loading={deleteTower.isPending} onPress={remove} />
      <Text variant="footnote" color="textTertiary">
        If delete fails, remove linked flats and residents first.
      </Text>
    </Screen>
  );
}
