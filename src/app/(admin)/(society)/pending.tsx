import { View } from 'react-native';
import { alert } from '@/lib/alert';
import { useTranslation } from 'react-i18next';

import { Button, Card, EmptyState, Screen, ScreenLoading, StatusPill, Text } from '@/components';
import { formatDateTime, formatFlatLabel, titleize } from '@/lib/format';
import { useApproveResident, usePendingApprovals, useRejectResident } from '@/queries/usePendingResidents';
import { useAuthStore } from '@/stores/authStore';

export default function PendingResidentsScreen() {
  const { t } = useTranslation();
  const societyId = useAuthStore((s) => s.profile?.society_id);
  const { data: residents = [], isLoading } = usePendingApprovals(societyId);
  const approve = useApproveResident();
  const reject = useRejectResident();

  if (isLoading) return <ScreenLoading safe={false} />;

  const rejectResident = (profileId: string) => {
    alert(t('alert.titles.rejectRequest'), t('alert.messages.rejectBlocksProfile'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.reject'), style: 'destructive', onPress: () => reject.mutate(profileId) },
    ]);
  };

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      {!residents.length && (
        <EmptyState icon="verified_user" title={t('admin.society.noPending')} subtitle={t('admin.society.noPendingSub')} />
      )}
      {residents.map((resident) => {
        const flatLabel = resident.flat_residents
          ?.map((link) => formatFlatLabel(link.flats?.towers?.name, link.flats?.number, link.flat_id))
          .join(', ');
        return (
          <Card key={resident.id} className="gap-md">
            <View>
              <View className="flex-row items-center gap-sm">
                <Text variant="title">{resident.full_name}</Text>
                <StatusPill tone="neutral" label={titleize(resident.role)} />
              </View>
              <Text variant="footnote" color="textSecondary">
                {formatDateTime(resident.created_at)}
              </Text>
              <Text variant="body" color="textSecondary">
                {resident.role === 'guard' ? t('nav.screens.addGuard') : flatLabel || t('status.notLinked')}
              </Text>
            </View>
            <View className="flex-row gap-md">
              <Button label={t('common.approve')} icon="check_circle" full className="flex-1" loading={approve.isPending} onPress={() => approve.mutate(resident.id)} />
              <Button label={t('common.reject')} icon="cancel" full variant="outlined" className="flex-1" loading={reject.isPending} onPress={() => rejectResident(resident.id)} />
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}
