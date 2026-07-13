import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components';

interface Props {
  active: number;
  resolvedThisMonth: number;
}

export function HelpdeskSummary({ active, resolvedThisMonth }: Props) {
  const { t } = useTranslation();

  return (
    <View className="rounded-md bg-surface-secondary px-base py-md">
      <Text variant="subhead" color="textSecondary">
        {t('resident.complaints.summaryOpenResolved', { active, resolved: resolvedThisMonth })}
      </Text>
    </View>
  );
}
