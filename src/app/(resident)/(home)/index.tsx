import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useCSSVariable } from 'uniwind';

import { Avatar, Card, EmptyState, Screen, Text } from '@/components';
import { QuickActions } from '@/features/home/QuickActions';
import { BellButton } from '@/features/notifications/BellButton';
import { NoticeStripCard } from '@/features/notices/NoticeStripCard';
import { ExpectedTodayCard } from '@/features/visitors/ExpectedTodayCard';
import { PendingVisitorsStrip } from '@/features/visitors/PendingVisitorsStrip';
import { canRevokePreApproval, confirmRevokePreApproval } from '@/features/visitors/revokePreApproval';
import { formatDateTime, greeting } from '@/lib/format';
import {
  useExpectedToday,
  useHomeRefresh,
  usePendingVisitors,
  useRecentNotices,
  useUpcomingBooking,
} from '@/queries/useHome';
import { useMyFlatIds } from '@/queries/useMe';
import { useRevokePreApproval } from '@/queries/useVisitors';
import { useAuthStore } from '@/stores/authStore';

export default function HomeScreen() {
  const coral = useCSSVariable('--color-coral') as string;
  const profile = useAuthStore((s) => s.profile);
  const userId = useAuthStore((s) => s.session?.user.id);
  const { refreshing, refresh } = useHomeRefresh();
  const revokePreApproval = useRevokePreApproval();
  const { data: flatIds, isLoading: flatLoading } = useMyFlatIds();
  const { data: visitors, isLoading: visitorsLoading } = usePendingVisitors(flatIds);
  const { data: expected } = useExpectedToday(flatIds);
  const { data: notices } = useRecentNotices(profile?.society_id);
  const { data: booking } = useUpcomingBooking(profile?.id);
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there';

  return (
    <Screen
      scroll
      contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={coral} colors={[coral]} />
      }
    >
      <View className="flex-row items-start justify-between">
        <View>
          <Text variant="body" color="textSecondary">
            {greeting()},
          </Text>
          <Text variant="titleLarge">{firstName}</Text>
        </View>
        <View className="flex-row items-center gap-sm">
          <BellButton href="/(resident)/(home)/notifications" />
          <Pressable onPress={() => router.push('/(resident)/(menu)/profile' as Href)} accessibilityRole="button" accessibilityLabel="Open profile">
            <Avatar name={profile?.full_name ?? 'Resident'} uri={profile?.avatar_url ?? undefined} size="md" />
          </Pressable>
        </View>
      </View>

      {flatLoading || visitorsLoading ? (
        <PendingVisitorsStrip loading />
      ) : visitors?.length ? (
        <PendingVisitorsStrip visitors={visitors} />
      ) : (
        <EmptyState icon="verified_user" title="No visitors waiting" subtitle="New guard requests will appear here." />
      )}

      <QuickActions />

      {booking && (
        <Card variant="outlined" className="gap-xs">
          <Text variant="caption" color="textSecondary">
            UPCOMING BOOKING
          </Text>
          <Text variant="headline">{booking.amenities?.name ?? 'Amenity booking'}</Text>
          <Text variant="footnote" color="textSecondary">
            {formatDateTime(booking.start_at)}
          </Text>
        </Card>
      )}

      {!!expected?.length && (
        <View className="gap-sm">
          <View className="flex-row items-center justify-between">
            <Text variant="caption" color="textSecondary">
              EXPECTED TODAY
            </Text>
            <Text
              variant="caption"
              color="coral"
              onPress={() => router.push('/(resident)/(approvals)' as Href)}
            >
              See all
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {expected.map((preApproval) => (
              <ExpectedTodayCard
                key={preApproval.id}
                preApproval={preApproval}
                onRevoke={
                  canRevokePreApproval(preApproval, userId, profile?.role)
                    ? () => confirmRevokePreApproval(preApproval, (id) => revokePreApproval.mutate(id))
                    : undefined
                }
              />
            ))}
          </ScrollView>
        </View>
      )}

      {!!notices?.length && (
        <View className="gap-sm">
          <View className="flex-row items-center justify-between">
            <Text variant="caption" color="textSecondary">
              RECENT NOTICES
            </Text>
            <Text
              variant="caption"
              color="coral"
              onPress={() => router.push('/(resident)/(community)' as Href)}
            >
              View all
            </Text>
          </View>
          {notices.map((notice) => (
            <NoticeStripCard key={notice.id} notice={notice} />
          ))}
        </View>
      )}
    </Screen>
  );
}
