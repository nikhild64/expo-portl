
import { View } from 'react-native';
import { alertError, alertSuccess } from '@/lib/alert';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, Card, Screen, Text } from '@/components';
import { DuesCycleForm } from '@/features/admin/DuesCycleForm';
import { useAdminNavigation } from '@/lib/useAdminNavigation';
import { useDuesCycleStatus, useGenerateDuesCycle, useLastDuesCycleTemplate } from '@/queries/useDuesAdmin';
import { useAuthStore } from '@/stores/authStore';

function nextMonthPeriod() {
  const date = new Date();
  date.setMonth(date.getMonth() + 1, 1);
  return date.toISOString().slice(0, 10);
}

export default function AdminDuesScreen() {
  const { t } = useTranslation();
  const adminNav = useAdminNavigation();
  const societyId = useAuthStore((s) => s.profile?.society_id);
  const period = nextMonthPeriod();
  const { data: status } = useDuesCycleStatus(societyId, period);
  const { data: lastTemplate } = useLastDuesCycleTemplate(societyId);
  const generateCycle = useGenerateDuesCycle();

  const generate = async (values: Parameters<ComponentProps<typeof DuesCycleForm>['onSubmit']>[0]) => {
    if (!societyId) return;
    try {
      const inserted = await generateCycle.mutateAsync({
        dueDate: values.dueDate,
        lineItems: values.lineItems,
        period: values.period,
        societyId,
        total: values.total,
      });
      alertSuccess(t('alert.titles.cycleGenerated'), t('alert.messages.dueRowsCreated', { count: inserted ?? 0 }));
    } catch (error) {
      alertError(t('alert.titles.generationFailed'), error);
    }
  };

  return (
    <Screen scroll variant="tab">
      <Card className="gap-sm">
        <Text variant="caption" color="textSecondary">
          {t('admin.ops.nextMonthCycle')}
        </Text>
        <Text variant="titleLarge">
          {t('admin.ops.flatsGeneratedProgress', { generated: status?.generated ?? 0, total: status?.flats ?? 0 })}
        </Text>
        <Text variant="body" color="textSecondary">
          {t('common.forPeriod', { period })}
        </Text>
      </Card>
      <Card className="gap-xs">
        <View className="flex-row items-center gap-sm">
          <Text variant="footnote" color="textSecondary" className="uppercase tracking-wide">
            {t('admin.ops.autoScheduleTitle')}
          </Text>
        </View>
        <Text variant="body" color="textSecondary">
          {'• '}{t('admin.ops.autoScheduleDuesInfo')}
        </Text>
        <Text variant="body" color="textSecondary">
          {'• '}{t('admin.ops.autoScheduleReminderInfo')}
        </Text>
        <Text variant="caption" color="textSecondary" className="pt-xs">
          {t('admin.ops.manualOverrideHint')}
        </Text>
      </Card>
      <DuesCycleForm defaultLineItems={lastTemplate?.lineItems} loading={generateCycle.isPending} onSubmit={generate} />
      <Button label={t('admin.ops.viewDefaulters')} variant="tonal" icon="warning_amber" onPress={() => adminNav.push('dues/defaulters')} />
    </Screen>
  );
}
