import { View } from 'react-native';

import { Text } from '@/components';
import { titleize } from '@/lib/format';
import type { Tables } from '@/types/database';

const steps: Tables<'complaints'>['status'][] = ['new', 'assigned', 'in_progress', 'resolved'];

interface Props {
  status: Tables<'complaints'>['status'];
}

export function StatusTimeline({ status }: Props) {
  const currentIndex = Math.max(0, steps.indexOf(status === 'closed' ? 'resolved' : status));

  return (
    <View className="gap-sm">
      <Text variant="caption" color="textSecondary">
        STATUS
      </Text>
      <View className="flex-row items-center">
        {steps.map((step, index) => {
          const reached = index <= currentIndex;
          return (
            <View key={step} className="flex-1 items-center gap-xs">
              <View className={`h-3 w-3 rounded-pill ${reached ? 'bg-coral' : 'bg-surface-tertiary'}`} />
              <Text variant="caption" color={reached ? 'coral' : 'textTertiary'} className="text-center">
                {titleize(step)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
