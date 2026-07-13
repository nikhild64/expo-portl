import { router, type Href } from 'expo-router';

import { Card, IconSymbol, Text } from '@/components';

interface Props {
  count: number;
}

export function AlertBanner({ count }: Props) {
  if (!count) return null;

  return (
    <Card accent="warning" className="flex-row items-center gap-md" onTouchEnd={() => router.push('/(admin)/(society)/pending' as Href)}>
      <IconSymbol name="notifications" color="warning" />
      <Text variant="body" className="flex-1">
        {count} pending resident request{count === 1 ? '' : 's'} need review.
      </Text>
    </Card>
  );
}
