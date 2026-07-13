import { View } from 'react-native';

import { Text } from '@/components';

interface Props {
  active: number;
  resolvedThisMonth: number;
}

export function HelpdeskSummary({ active, resolvedThisMonth }: Props) {
  return (
    <View className="rounded-md bg-surface-secondary px-base py-md">
      <Text variant="subhead" color="textSecondary">
        {active} open • {resolvedThisMonth} resolved this month
      </Text>
    </View>
  );
}
