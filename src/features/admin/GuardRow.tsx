import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card, StatusPill, Text } from '@/components';
import i18n from '@/i18n';
import { createStatusDisplay } from '@/lib/statusDisplay';
import type { GuardProfile } from '@/queries/useAdminGuards';

const guardStatus = createStatusDisplay<GuardProfile['status']>({
  active: { label: () => i18n.t('status.active'), tone: 'success' },
  blocked: { label: () => i18n.t('status.blocked'), tone: 'danger' },
  pending: { label: () => i18n.t('status.pending'), tone: 'warning' },
});

interface Props {
  guard: GuardProfile;
  onPress?: () => void;
}

export const GuardRow = memo(function GuardRow({ guard, onPress }: Props) {
  const { t } = useTranslation();

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={guard.full_name ?? t('nav.screens.addGuard')}>
      <Card variant="outlined" className="gap-sm">
        <View className="flex-row items-start justify-between gap-md">
          <View className="flex-1">
            <Text variant="headline">{guard.full_name}</Text>
            <Text variant="footnote" color="textSecondary">
              {guard.phone ?? t('format.phoneNotShared')}
            </Text>
          </View>
          <StatusPill tone={guardStatus.tone(guard.status)} label={guardStatus.label(guard.status)} />
        </View>
      </Card>
    </Pressable>
  );
});
