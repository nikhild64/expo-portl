import { alertConfirm, alertError, alertSuccess } from '@/lib/alert';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button, Card, Screen, ScreenLoading, Text } from '@/components';
import { ResidentForm, type ResidentFormValues } from '@/features/admin/ResidentForm';
import { useGuardDetail, useUpdateGuard } from '@/queries/useAdminGuards';

export default function AdminGuardDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: guard, isLoading } = useGuardDetail(id);
  const updateGuard = useUpdateGuard();

  if (isLoading || !guard) return <ScreenLoading variant="tab" />;

  const save = async (values: ResidentFormValues) => {
    try {
      await updateGuard.mutateAsync({
        id: guard.id,
        patch: { full_name: values.fullName, phone: values.phone || null, status: values.status },
      });
      alertSuccess(t('alert.titles.guardUpdated'), t('alert.messages.changesSaved'));
    } catch (error) {
      alertError(t('alert.titles.updateFailed'), error);
    }
  };

  const blockGuard = () => {
    alertConfirm(t('alert.titles.blockGuard'), t('alert.messages.blockedGuards'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.block'),
        style: 'destructive',
        onPress: () => updateGuard.mutate({ id: guard.id, patch: { status: 'blocked' } }),
      },
    ]);
  };

  return (
    <Screen scroll variant="tab">
      <ResidentForm
        resident={{ ...guard, flat_residents: [] }}
        heading={t('admin.society.guardProfile')}
        loading={updateGuard.isPending}
        onSubmit={save}
      />
      <Card className="gap-md">
        <Text variant="body" color="textSecondary">
          {t('admin.society.guardAccountNote')}
        </Text>
        <Button label={t('admin.society.blockGuardBtn')} variant="danger" onPress={blockGuard} />
      </Card>
    </Screen>
  );
}
