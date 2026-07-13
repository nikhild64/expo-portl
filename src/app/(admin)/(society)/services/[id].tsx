import { Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

import { Button, Screen, ScreenLoading } from '@/components';
import { ServiceForm, type ServiceFormValues } from '@/features/admin/ServiceForm';
import { useDeleteService, useServiceProvider, useUpsertService } from '@/queries/useServices';

export default function AdminServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: service, isLoading } = useServiceProvider(id);
  const upsertService = useUpsertService();
  const deleteService = useDeleteService();

  if (isLoading || !service) return <ScreenLoading safe={false} />;

  const save = async (values: ServiceFormValues) => {
    await upsertService.mutateAsync({
      category: values.category,
      id: service.id,
      name: values.name,
      phone: values.phone || null,
      verified: values.verified,
    });
    Alert.alert('Service provider updated');
  };

  const remove = () => {
    Alert.alert('Delete provider?', 'This removes them from the resident directory.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteService.mutateAsync(service.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <ServiceForm service={service} loading={upsertService.isPending} onSubmit={save} />
      <Button label="Delete provider" variant="danger" icon="delete" loading={deleteService.isPending} onPress={remove} />
    </Screen>
  );
}
