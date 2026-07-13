import { Alert } from 'react-native';
import type { ComponentProps } from 'react';
import { router } from 'expo-router';

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
      Alert.alert('Cycle generated', `${inserted ?? 0} due rows created.`);
    } catch (error) {
      Alert.alert('Generation failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <Card className="gap-sm">
        <Text variant="caption" color="textSecondary">
          NEXT MONTH CYCLE
        </Text>
        <Text variant="titleLarge">
          {status?.generated ?? 0} of {status?.flats ?? 0} flats generated
        </Text>
        <Text variant="body" color="textSecondary">
          Period {period}
        </Text>
      </Card>
      <DuesCycleForm loading={generateCycle.isPending} onSubmit={generate} />
      <Button label="View defaulters" variant="tonal" icon="warning_amber" onPress={() => router.push('/(admin)/(ops)/dues/defaulters')} />
    </Screen>
  );
}
