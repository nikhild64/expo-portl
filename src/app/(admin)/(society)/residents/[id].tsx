import { Alert, View } from 'react-native';
import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';

import { Button, Card, Field, Screen, SkeletonCard, Text } from '@/components';
import { ResidentForm, type ResidentFormValues } from '@/features/admin/ResidentForm';
import { useAssignResidentFlat, useRemoveResidentFlat, useResidentDetail, useUpdateResident } from '@/queries/useAdminResidents';

export default function AdminResidentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: resident, isLoading } = useResidentDetail(id);
  const updateResident = useUpdateResident();
  const assignFlat = useAssignResidentFlat();
  const removeFlat = useRemoveResidentFlat();
  const [flatId, setFlatId] = useState('');

  if (isLoading || !resident) return <SkeletonCard />;

  const save = async (values: ResidentFormValues) => {
    try {
      await updateResident.mutateAsync({
        id: resident.id,
        patch: { full_name: values.fullName, phone: values.phone || null, status: values.status },
      });
      Alert.alert('Resident updated', 'Changes have been saved.');
    } catch (error) {
      Alert.alert('Update failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const assign = async () => {
    if (!flatId.trim()) return;
    try {
      await assignFlat.mutateAsync({ flatId: flatId.trim(), profileId: resident.id });
      setFlatId('');
    } catch (error) {
      Alert.alert('Assignment failed', error instanceof Error ? error.message : 'Please verify the flat id.');
    }
  };

  const blockResident = () => {
    Alert.alert('Block resident?', 'Blocked residents cannot access the app.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block',
        style: 'destructive',
        onPress: () => updateResident.mutate({ id: resident.id, patch: { status: 'blocked' } }),
      },
    ]);
  };

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <ResidentForm resident={resident} loading={updateResident.isPending} onSubmit={save} />

      <Card className="gap-md">
        <Text variant="headline">Linked flats</Text>
        {resident.flat_residents?.map((link) => (
          <View key={link.flat_id} className="flex-row items-center justify-between gap-md">
            <View className="flex-1">
              <Text variant="body">
                {link.flats?.towers?.name ?? 'Tower'} {link.flats?.number ?? link.flat_id}
              </Text>
              <Text variant="caption" color="textSecondary">
                {link.is_owner ? 'Owner' : 'Resident'}{link.is_head ? ' - Head of flat' : ''}
              </Text>
            </View>
            <Button label="Remove" size="sm" variant="text" onPress={() => removeFlat.mutate({ flatId: link.flat_id, profileId: resident.id })} />
          </View>
        ))}
        {!resident.flat_residents?.length && (
          <Text variant="body" color="textSecondary">
            No flat linked yet.
          </Text>
        )}
        <Field label="Assign flat by ID" value={flatId} onChangeText={setFlatId} placeholder="Paste flat UUID" autoCapitalize="none" />
        <Button label="Assign flat" variant="tonal" loading={assignFlat.isPending} onPress={assign} />
      </Card>

      <Button label="Block resident" variant="danger" icon="lock" loading={updateResident.isPending} onPress={blockResident} />
    </Screen>
  );
}
