import { Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

import { Button, Screen, ScreenLoading } from '@/components';
import { FlatForm, type FlatFormValues } from '@/features/admin/FlatForm';
import { useDeleteFlat, useFlat, useUpsertFlat } from '@/queries/useTowers';

export default function AdminFlatDetailScreen() {
  const { towerId, flatId } = useLocalSearchParams<{ towerId: string; flatId: string }>();
  const { data: flat, isLoading } = useFlat(flatId);
  const upsertFlat = useUpsertFlat();
  const deleteFlat = useDeleteFlat();

  if (isLoading || !flat) return <ScreenLoading safe={false} />;

  const save = async (values: FlatFormValues) => {
    try {
      await upsertFlat.mutateAsync({
        bhk: values.bhk ?? null,
        floor: values.floor ?? null,
        id: flat.id,
        number: values.number,
        tower_id: towerId,
      });
      Alert.alert('Flat updated');
    } catch (error) {
      Alert.alert('Update failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const remove = () => {
    Alert.alert('Delete flat?', 'This will fail if residents, visitors, dues, or bookings still reference the flat.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteFlat.mutateAsync(flat.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <FlatForm flat={flat} loading={upsertFlat.isPending} onSubmit={save} />
      <Button label="Delete flat" variant="danger" icon="delete" loading={deleteFlat.isPending} onPress={remove} />
    </Screen>
  );
}
