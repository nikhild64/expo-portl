import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Card, IconSymbol, Text } from '@/components';

interface Props {
  count: number;
}

export function AlertBanner({ count }: Props) {
  const { t } = useTranslation();

  if (!count) return null;

  return (
    <Card className="flex-row items-center gap-md" onTouchEnd={() => router.push('/(admin)/(dashboard)/pending')}>
      <IconSymbol name="notifications" color="warning" />
      <Text variant="body" className="flex-1">
        {t('admin.dashboard.pendingResidentRequests', { count })}
      </Text>
    </Card>
  );
}
