import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button, IconSymbol, Screen, SkeletonCard, Text } from '@/components';
import { greeting, formatFlatLabel } from '@/lib/format';
import { EntryTypeGrid } from '@/features/guard/EntryTypeGrid';
import { FlatSearchField } from '@/features/guard/FlatSearchField';
import { BellButton } from '@/features/notifications/BellButton';
import { RecentActivityList } from '@/features/guard/RecentActivityList';
import { StatStrip } from '@/features/guard/StatStrip';
import { useGuardNavigation } from '@/lib/useGuardNavigation';
import { useQueryRefresh } from '@/queries/useNotificationPreferences';
import { useRecentActivity } from '@/queries/useGuardActivity';
import { useInsideCount, usePendingApprovalsCount, useTodayVisitorsCount } from '@/queries/useGuardStats';
import { useAuthStore } from '@/stores/authStore';

export default function GuardHomeScreen() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const guardNav = useGuardNavigation();
  const firstName = profile?.full_name?.split(' ')[0] ?? 'Guard';
  const societyId = profile?.society_id;
  const { data: inside, isLoading: insideLoading } = useInsideCount(societyId);
  const { data: pending, isLoading: pendingLoading } = usePendingApprovalsCount(societyId);
  const { data: today, isLoading: todayLoading } = useTodayVisitorsCount(societyId);
  const { data: recent, isLoading: recentLoading } = useRecentActivity(societyId);
  const { refreshing, refresh } = useQueryRefresh([['guard-stats'], ['guard-activity'], ['notifications']]);
  const statsLoading = insideLoading || pendingLoading || todayLoading;

  return (
    <Screen scroll refreshing={refreshing} onRefresh={refresh} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <View className="flex-row items-start justify-between">
        <View>
          <Text variant="body" color="textSecondary">
            {greeting()},
          </Text>
          <Text variant="titleLarge">{firstName}</Text>
        </View>
        <View className="flex-row items-center gap-sm">
          <View className="flex-row items-center gap-xs rounded-pill bg-coral-light px-md py-sm">
            <IconSymbol name="schedule" size={14} color="coral" />
            <Text variant="caption" color="coral">
              {t('guard.home.shift')}
            </Text>
          </View>
          <BellButton href={guardNav.href('notifications')} />
        </View>
      </View>

      {statsLoading ? <SkeletonCard /> : <StatStrip inside={inside} pending={pending} today={today} />}

      <FlatSearchField
        societyId={societyId}
        fieldLabel={t('common.search')}
        placeholder={t('guard.home.flatSearch')}
        onSelect={(flat) => {
          const label = formatFlatLabel(flat.tower_name, flat.number, 'Flat');
          const flatLabel = `${label}${flat.primary_resident ? ` (${flat.primary_resident})` : ''}`;
          router.push({
            pathname: '/(guard)/(home)/new',
            params: {
              type: 'guest',
              flatId: flat.id,
              flatLabel: encodeURIComponent(flatLabel),
            },
          });
        }}
      />

      <EntryTypeGrid baseHref="/(guard)/(home)/new" />

      <Button
        label={t('guard.add.scanPreapprovalQr')}
        icon="qr_code_scanner"
        variant="outlined"
        onPress={() => router.push('/(guard)/(home)/scan')}
      />

      {recentLoading ? <SkeletonCard /> : <RecentActivityList visitors={recent} />}
    </Screen>
  );
}
