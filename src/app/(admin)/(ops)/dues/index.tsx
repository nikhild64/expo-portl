
import { alert } from '@/lib/alert';
import type { ComponentProps } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button, Card, Screen, Text } from '@/components';
import { DuesCycleForm } from '@/features/admin/DuesCycleForm';
import { useDuesCycleStatus, useGenerateDuesCycle } from '@/queries/useDuesAdmin';
import { useAuthStore } from '@/stores/authStore';

function nextMonthPeriod() {
  const date = new Date();
  date.setMonth(date.getMonth() + 1, 1);
  return date.toISOString().slice(0, 10);
}

export default function AdminDuesScreen() {
  const { t } = useTranslation();
  const societyId = useAuthStore((s) => s.profile?.society_id);
  const period = nextMonthPeriod();
  const { data: status } = useDuesCycleStatus(societyId, period);
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
      alert(t('alert.titles.cycleGenerated'), t('alert.messages.dueRowsCreated', { count: inserted ?? 0 }));
    } catch (error) {
      alert(t('alert.titles.generationFailed'), error instanceof Error ? error.message : t('common.pleaseTryAgain'));
    }
  };

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
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
      <DuesCycleForm loading={generateCycle.isPending} onSubmit={generate} />
      <Button label={t('admin.ops.viewDefaulters')} variant="tonal" icon="warning_amber" onPress={() => router.push('/(admin)/(ops)/dues/defaulters')} />
    </Screen>
  );
}
