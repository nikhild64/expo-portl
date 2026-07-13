import { View } from 'react-native';
import { router } from 'expo-router';

import { Button, IconSymbol, Screen, SkeletonCard, Text } from '@/components';
import { EntryTypeGrid } from '@/features/guard/EntryTypeGrid';
import { BellButton } from '@/features/notifications/BellButton';
import { RecentActivityList } from '@/features/guard/RecentActivityList';
import { StatStrip } from '@/features/guard/StatStrip';
import { useRecentActivity } from '@/queries/useGuardActivity';
import { useInsideCount, usePendingApprovalsCount, useTodayVisitorsCount } from '@/queries/useGuardStats';
import { useAuthStore } from '@/stores/authStore';

export default function GuardHomeScreen() {
  const profile = useAuthStore((s) => s.profile);
  const firstName = profile?.full_name?.split(' ')[0] ?? 'Guard';
  const societyId = profile?.society_id;
  const { data: inside, isLoading: insideLoading } = useInsideCount(societyId);
  const { data: pending, isLoading: pendingLoading } = usePendingApprovalsCount(societyId);
  const { data: today, isLoading: todayLoading } = useTodayVisitorsCount(societyId);
  const { data: recent, isLoading: recentLoading } = useRecentActivity(societyId);
  const statsLoading = insideLoading || pendingLoading || todayLoading;

  return (
    <Screen scroll contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <View className="flex-row items-start justify-between">
        <View>
          <Text variant="body" color="textSecondary">
            Good evening,
          </Text>
          <Text variant="titleLarge">{firstName}</Text>
        </View>
        <View className="flex-row items-center gap-sm">
          <View className="flex-row items-center gap-xs rounded-pill bg-coral-light px-md py-sm">
            <IconSymbol name="schedule" size={14} color="coral" />
            <Text variant="caption" color="coral">
              SHIFT: 6AM-2PM
            </Text>
          </View>
          <BellButton href="/(guard)/(menu)/notifications" />
        </View>
      </View>

      {statsLoading ? <SkeletonCard /> : <StatStrip inside={inside} pending={pending} today={today} />}

      <EntryTypeGrid />

      <Button
        label="Scan pre-approval QR"
        icon="qr_code_scanner"
        variant="outlined"
        onPress={() => router.push('/(guard)/(add)/scan' as never)}
      />

      {recentLoading ? <SkeletonCard /> : <RecentActivityList visitors={recent} />}
    </Screen>
  );
}
