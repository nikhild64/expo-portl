
import { upsertWithAlert } from '@/lib/upsertWithAlert';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Card, EmptyState, ListRow, Screen, ScreenLoading, StatusPill } from '@/components';
import { StaffForm, type StaffFormValues } from '@/features/admin/StaffForm';
import { titleize } from '@/lib/format';
import { useStaff, useUpsertStaff } from '@/queries/useStaff';
import { useAuthStore } from '@/stores/authStore';

export default function AdminStaffScreen() {
  const { t } = useTranslation();
  const societyId = useAuthStore((s) => s.profile?.society_id);
  const { data: staff = [], isLoading } = useStaff(societyId);
  const upsertStaff = useUpsertStaff();

  if (isLoading) return <ScreenLoading variant="tab" />;

  const save = async (values: StaffFormValues) => {
    if (!societyId) return;
    await upsertWithAlert({
      t,
      successTitle: t('alert.titles.staffSaved'),
      mutate: () =>
        upsertStaff.mutateAsync({
          active: values.active,
          name: values.name,
          phone: values.phone || null,
          photo_url: values.photoUrl || null,
          role: values.role,
          shift_end: values.shiftEnd || null,
          shift_start: values.shiftStart || null,
          society_id: societyId,
          verified: values.verified,
        }),
    });
  };

  return (
    <Screen scroll variant="tab">
      <Text variant="body" color="textSecondary" className="px-base pt-3">
        {t('admin.society.staffRosterNote')}
      </Text>
      <StaffForm loading={upsertStaff.isPending} onSubmit={save} />
      <Card padding="none" className="overflow-hidden">
        {staff.map((member) => (
          <ListRow
            key={member.id}
            title={member.name}
            subtitle={`${titleize(member.role)} - ${member.phone ?? t('format.phoneNotShared')}`}
            right={<StatusPill tone={member.active ? 'success' : 'neutral'} label={member.active ? t('common.active') : t('common.inactive')} />}
            onPress={() => router.push(`/(admin)/(society)/staff/${member.id}`)}
          />
        ))}
        {!staff.length && <EmptyState icon="person" title={t('admin.society.noStaff')} subtitle={t('admin.society.noStaffSub')} />}
      </Card>
    </Screen>
  );
}
