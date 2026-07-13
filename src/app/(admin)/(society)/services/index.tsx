import { Alert } from 'react-native';
import { router } from 'expo-router';

import { Card, EmptyState, ListRow, Screen, ScreenLoading, StatusPill } from '@/components';
import { ServiceForm, type ServiceFormValues } from '@/features/admin/ServiceForm';
import { titleize } from '@/lib/format';
import { useServices, useUpsertService } from '@/queries/useServices';
import { useAuthStore } from '@/stores/authStore';

export default function AdminServicesScreen() {
  const societyId = useAuthStore((s) => s.profile?.society_id);
  const { data: services = [], isLoading } = useServices(societyId);
  const upsertService = useUpsertService();

  if (isLoading) return <ScreenLoading safe={false} />;

  const save = async (values: ServiceFormValues) => {
    if (!societyId) return;
    try {
      await upsertService.mutateAsync({
        category: values.category,
        name: values.name,
        phone: values.phone || null,
        society_id: societyId,
        verified: values.verified,
      });
      Alert.alert('Service provider saved');
    } catch (error) {
      Alert.alert('Save failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <ServiceForm loading={upsertService.isPending} onSubmit={save} />
      <Card padding="none" className="overflow-hidden">
        {services.map((service) => (
          <ListRow
            key={service.id}
            title={service.name}
            subtitle={`${titleize(service.category)} - ${service.phone ?? 'No phone'}`}
            right={<StatusPill tone={service.verified ? 'success' : 'neutral'} label={service.verified ? 'Verified' : 'Unverified'} />}
            onPress={() => router.push(`/(admin)/(society)/services/${service.id}`)}
          />
        ))}
        {!services.length && <EmptyState icon="construction" title="No services yet" subtitle="Add a provider above." />}
      </Card>
    </Screen>
  );
}
