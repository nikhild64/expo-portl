
import { alert } from '@/lib/alert';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button, Screen, ScreenLoading } from '@/components';
import { ServiceForm, type ServiceFormValues } from '@/features/admin/ServiceForm';
import { useDeleteService, useServiceProvider, useUpsertService } from '@/queries/useServices';

export default function AdminServiceDetailScreen() {
  const { t } = useTranslation();
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
    alert(t('alert.titles.serviceProviderUpdated'));
  };

  const remove = () => {
    alert(t('alert.titles.deleteProvider'), t('alert.messages.removeProvider'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
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
      <Button label={`${t('common.delete')} ${t('nav.screens.serviceProvider').toLowerCase()}`} variant="danger" icon="delete" loading={deleteService.isPending} onPress={remove} />
    </Screen>
  );
}
