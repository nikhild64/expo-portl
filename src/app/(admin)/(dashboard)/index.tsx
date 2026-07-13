import { View } from 'react-native';
import { router } from 'expo-router';

import { Button, Screen, SkeletonCard, Text } from '@/components';
import { greeting } from '@/lib/format';
import { useAdminNavigation } from '@/lib/useAdminNavigation';
import { AlertBanner } from '@/features/admin/AlertBanner';
import { BellButton } from '@/features/notifications/BellButton';
import { KpiAmenities } from '@/features/admin/KpiAmenities';
import { KpiComplaints } from '@/features/admin/KpiComplaints';
import { KpiDues } from '@/features/admin/KpiDues';
import { KpiVisitors } from '@/features/admin/KpiVisitors';
import { LiveActivityFeed } from '@/features/admin/LiveActivityFeed';
import {
  useAdminActivity,
  useAmenityUsageKpi,
  useDuesCollectedKpi,
  useOpenComplaintsKpi,
  usePendingJoinRequests,
  useTodayVisitorsKpi,
} from '@/queries/useAdminDashboard';
import { useQueryRefresh } from '@/queries/useNotificationPreferences';
import { useAuthStore } from '@/stores/authStore';

export default function AdminDashboardScreen() {
  const profile = useAuthStore((s) => s.profile);
  const societyId = profile?.society_id;
  const adminNav = useAdminNavigation();
  const visitors = useTodayVisitorsKpi(societyId);
  const complaints = useOpenComplaintsKpi(societyId);
  const dues = useDuesCollectedKpi(societyId);
  const amenities = useAmenityUsageKpi(societyId);
  const pending = usePendingJoinRequests(societyId);
  const activity = useAdminActivity(societyId);
  const { refreshing, refresh } = useQueryRefresh([
    ['admin-dashboard'],
    ['notifications'],
  ]);
  const firstName = profile?.full_name?.split(' ')[0] ?? 'Admin';

  return (
    <Screen scroll refreshing={refreshing} onRefresh={refresh} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <View className="flex-row items-start justify-between gap-md">
        <View className="flex-1">
          <Text variant="body" color="textSecondary">
            Society control center
          </Text>
          <Text variant="titleLarge">{greeting()}, {firstName}</Text>
        </View>
        <BellButton href={adminNav.href('notifications')} />
      </View>

      <AlertBanner count={pending.data?.length ?? 0} />

      {visitors.isLoading || complaints.isLoading || dues.isLoading || amenities.isLoading ? (
        <View className="gap-md">
          <View className="flex-row gap-md">
            <SkeletonCard />
            <SkeletonCard />
          </View>
          <View className="flex-row gap-md">
            <SkeletonCard />
            <SkeletonCard />
          </View>
        </View>
      ) : (
        <View className="gap-md">
          <View className="flex-row gap-md">
            <KpiVisitors count={visitors.data?.count} previous={visitors.data?.previous} trend={visitors.data?.trend} />
            <KpiComplaints count={complaints.data?.count} breakdown={complaints.data?.breakdown} />
          </View>
          <View className="flex-row gap-md">
            <KpiDues collected={dues.data?.collected} total={dues.data?.total} percent={dues.data?.percent} />
            <KpiAmenities usage={amenities.data} />
          </View>
        </View>
      )}

      <View className="flex-row gap-md">
        <Button label="Pending" variant="tonal" icon="verified_user" full className="flex-1" onPress={() => router.push('/(admin)/(dashboard)/pending')} />
        <Button label="Gate" variant="tonal" icon="qr_code" full className="flex-1" onPress={() => router.push('/(admin)/(dashboard)/gate')} />
      </View>

      <LiveActivityFeed items={activity.data ?? []} />
    </Screen>
  );
}
