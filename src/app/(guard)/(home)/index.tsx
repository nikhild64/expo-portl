import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button, Screen, SkeletonCard, Text } from '@/components';
import { greeting, formatFirstName, formatFlatLabel } from '@/lib/format';
import { EntryTypeGrid } from '@/features/guard/EntryTypeGrid';
import { FlatSearchField } from '@/features/guard/FlatSearchField';
import { BellButton } from '@/features/notifications/BellButton';
import { RecentActivityList } from '@/features/guard/RecentActivityList';
import { StatStrip } from '@/features/guard/StatStrip';
import { useGuardNavigation } from '@/lib/useGuardNavigation';
import { guardNewEntryHref } from '@/lib/guardRoutes';
import { useQueryRefresh } from '@/queries/useNotificationPreferences';
import { useRecentActivity } from '@/queries/useGuardActivity';
import { useGuardStats } from '@/queries/useGuardStats';
import { useAuthStore } from '@/stores/authStore';

export default function GuardHomeScreen() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const guardNav = useGuardNavigation();
  const firstName = formatFirstName(profile?.full_name, 'Guard');
  const societyId = profile?.society_id;
  const { data: stats, isLoading: statsLoading } = useGuardStats(societyId);
  const { data: recent, isLoading: recentLoading } = useRecentActivity(societyId);
  const { refreshing, refresh } = useQueryRefresh([['guard-stats'], ['guard-activity'], ['notifications']]);

  return (
    <Screen scroll variant="tab" safeTop refreshing={refreshing} onRefresh={refresh}>
      <View className="flex-row items-start justify-between">
        <View>
          <Text variant="body" color="textSecondary">
            {greeting()},
          </Text>
          <Text variant="titleLarge">{firstName}</Text>
        </View>
        <BellButton href={guardNav.href('notifications')} />
      </View>

      {statsLoading ? <SkeletonCard /> : <StatStrip inside={stats?.inside} pending={stats?.pending} today={stats?.today} />}

      <Button
        label={t('nav.screens.raiseAlert')}
        icon="warning_amber"
        variant="outlined"
        size="sm"
        onPress={() => guardNav.push('alerts')}
      />

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

      <EntryTypeGrid baseHref={guardNewEntryHref(guardNav.segments)} />

      <Button
        label={t('guard.add.scanPreapprovalQr')}
        icon="qr_code_scanner"
        variant="outlined"
        onPress={() => guardNav.push('scan')}
      />

      {recentLoading ? <SkeletonCard /> : <RecentActivityList visitors={recent} />}
    </Screen>
  );
}
