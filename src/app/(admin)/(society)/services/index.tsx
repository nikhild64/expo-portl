
import { upsertWithAlert } from '@/lib/upsertWithAlert';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Card, EmptyState, ListRow, Screen, ScreenLoading, StatusPill } from '@/components';
import { ServiceForm, type ServiceFormValues } from '@/features/admin/ServiceForm';
import { titleize } from '@/lib/format';
import { useServices, useUpsertService } from '@/queries/useServices';
import { useAuthStore } from '@/stores/authStore';

export default function AdminServicesScreen() {
  const { t } = useTranslation();
  const societyId = useAuthStore((s) => s.profile?.society_id);
  const { data: services = [], isLoading } = useServices(societyId);
  const upsertService = useUpsertService();

  if (isLoading) return <ScreenLoading variant="tab" />;

  const save = async (values: ServiceFormValues) => {
    if (!societyId) return;
    await upsertWithAlert({
      t,
      successTitle: t('alert.titles.serviceProviderSaved'),
      mutate: () =>
        upsertService.mutateAsync({
          category: values.category,
          name: values.name,
          phone: values.phone || null,
          society_id: societyId,
          verified: values.verified,
        }),
    });
  };

  return (
    <Screen scroll variant="tab">
      <ServiceForm loading={upsertService.isPending} onSubmit={save} />
      <Card padding="none" className="overflow-hidden">
        {services.map((service) => (
          <ListRow
            key={service.id}
            title={service.name}
            subtitle={`${titleize(service.category)} - ${service.phone ?? t('format.phoneNotShared')}`}
            right={<StatusPill tone={service.verified ? 'success' : 'neutral'} label={service.verified ? t('common.verified') : t('common.unverified')} />}
            onPress={() => router.push(`/(admin)/(society)/services/${service.id}`)}
          />
        ))}
        {!services.length && <EmptyState icon="construction" title={t('admin.society.noServices')} subtitle={t('admin.society.noServicesSub')} />}
      </Card>
    </Screen>
  );
}
