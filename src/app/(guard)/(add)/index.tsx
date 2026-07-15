import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, Screen, Text } from '@/components';
import { EntryTypeGrid } from '@/features/guard/EntryTypeGrid';
import { FlatSearchField } from '@/features/guard/FlatSearchField';
import { formatFlatLabel } from '@/lib/format';
import { useGuardNavigation } from '@/lib/useGuardNavigation';
import { guardNewEntryHref } from '@/lib/guardRoutes';
import { useAuthStore } from '@/stores/authStore';

export default function AddVisitorScreen() {
  const { t } = useTranslation();
  const guardNav = useGuardNavigation();
  const societyId = useAuthStore((s) => s.profile?.society_id);

  return (
    <Screen scroll variant="tab">
      <View className="gap-xs">
        <Text variant="titleLarge">{t('guard.add.whoAtGate')}</Text>
        <Text variant="body" color="textSecondary">
          {t('guard.add.chooseEntryType')}
        </Text>
      </View>

      <FlatSearchField
        societyId={societyId}
        fieldLabel={t('common.search')}
        placeholder={t('guard.home.flatSearch')}
        onSelect={(flat) => {
          const label = formatFlatLabel(flat.tower_name, flat.number);
          const flatLabel = `${label}${flat.primary_resident ? ` (${flat.primary_resident})` : ''}`;
          router.push({
            pathname: guardNewEntryHref(guardNav.segments),
            params: {
              type: 'guest',
              flatId: flat.id,
              flatLabel: encodeURIComponent(flatLabel),
            },
          });
        }}
      />

      <EntryTypeGrid baseHref={guardNewEntryHref(guardNav.segments)} compact />
      <Button
        label={t('guard.add.scanPreapprovalQr')}
        icon="qr_code_scanner"
        variant="outlined"
        onPress={() => guardNav.push('scan')}
      />
    </Screen>
  );
}
