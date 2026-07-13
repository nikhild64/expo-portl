import { Alert } from 'react-native';
import { useLocalSearchParams, router, type Href } from 'expo-router';

import { Card, EmptyState, ListRow, Screen, SkeletonCard } from '@/components';
import { BulkFlatForm, FlatForm, type BulkFlatValues, type FlatFormValues } from '@/features/admin/FlatForm';
import { useBulkCreateFlats, useFlats, useUpsertFlat } from '@/queries/useTowers';

export default function AdminTowerFlatsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: flats = [], isLoading } = useFlats(id);
  const upsertFlat = useUpsertFlat();
  const bulkCreate = useBulkCreateFlats();

  if (isLoading) return <SkeletonCard />;

  const createFlat = async (values: FlatFormValues) => {
    try {
      await upsertFlat.mutateAsync({ bhk: values.bhk ?? null, floor: values.floor ?? null, number: values.number, tower_id: id });
      Alert.alert('Flat saved');
    } catch (error) {
      Alert.alert('Save failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const generate = async (values: BulkFlatValues) => {
    const existing = new Set(flats.map((flat) => flat.number));
    const rows = Array.from({ length: values.floors }).flatMap((_, floorIndex) => {
      const floor = floorIndex + 1;
      return Array.from({ length: values.unitsPerFloor }).map((__, unitIndex) => {
        const number = `${floor}${String(unitIndex + 1).padStart(2, '0')}`;
        return { bhk: 2, floor, number, tower_id: id };
      });
    }).filter((flat) => !existing.has(flat.number));

    if (!rows.length) {
      Alert.alert('Nothing to create', 'All generated flat numbers already exist.');
      return;
    }

    try {
      await bulkCreate.mutateAsync(rows);
      Alert.alert('Flats generated', `${rows.length} flats created.`);
    } catch (error) {
      Alert.alert('Bulk create failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <FlatForm loading={upsertFlat.isPending} onSubmit={createFlat} />
      <BulkFlatForm loading={bulkCreate.isPending} onSubmit={generate} />
      <Card padding="none" className="overflow-hidden">
        {flats.map((flat) => (
          <ListRow
            key={flat.id}
            title={`Flat ${flat.number}`}
            subtitle={`Floor ${flat.floor ?? '-'} - ${flat.bhk ?? '-'} BHK`}
            showChevron
            onPress={() => router.push(`/(admin)/(society)/towers/${id}/flats/${flat.id}` as Href)}
          />
        ))}
        {!flats.length && <EmptyState icon="apartment" title="No flats yet" subtitle="Create or bulk-generate flats above." />}
      </Card>
    </Screen>
  );
}
