import { View } from 'react-native';
import { router } from 'expo-router';

import { Button, Screen, SkeletonCard, Text } from '@/components';
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
import { useAuthStore } from '@/stores/authStore';

export default function AdminDashboardScreen() {
  const profile = useAuthStore((s) => s.profile);
  const societyId = profile?.society_id;
  const visitors = useTodayVisitorsKpi(societyId);
  const complaints = useOpenComplaintsKpi(societyId);
  const dues = useDuesCollectedKpi(societyId);
  const amenities = useAmenityUsageKpi(societyId);
  const pending = usePendingJoinRequests(societyId);
  const activity = useAdminActivity(societyId);
  const firstName = profile?.full_name?.split(' ')[0] ?? 'Admin';

  return (
    <Screen scroll contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <View className="flex-row items-start justify-between gap-md">
        <View className="flex-1">
          <Text variant="body" color="textSecondary">
            Society control center
          </Text>
          <Text variant="titleLarge">Good evening, {firstName}</Text>
        </View>
        <Button label="Today" size="sm" variant="tonal" icon="calendar_today" onPress={() => undefined} />
        <BellButton href="/(admin)/(menu)/notifications" />
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
        <Button label="Pending" variant="tonal" icon="verified_user" full onPress={() => router.push('/(admin)/(society)/pending' as never)} />
        <Button label="Gate" variant="tonal" icon="qr_code" full onPress={() => router.push('/(admin)/(ops)/gate' as never)} />
      </View>

      <LiveActivityFeed items={activity.data ?? []} />
    </Screen>
  );
}
