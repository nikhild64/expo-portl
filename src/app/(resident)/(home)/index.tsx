import { ScrollView, View } from 'react-native';

import { Card, EmptyState, Screen, SkeletonCard, Text } from '@/components';
import { QuickActions } from '@/features/home/QuickActions';
import { BellButton } from '@/features/notifications/BellButton';
import { NoticeStripCard } from '@/features/notices/NoticeStripCard';
import { ExpectedTodayCard } from '@/features/visitors/ExpectedTodayCard';
import { LiveVisitorCard } from '@/features/visitors/LiveVisitorCard';
import { formatDateTime, greeting } from '@/lib/format';
import { useExpectedToday, usePendingVisitors, useRecentNotices, useUpcomingBooking } from '@/queries/useHome';
import { useMyFlatIds } from '@/queries/useMe';
import { useAuthStore } from '@/stores/authStore';

export default function HomeScreen() {
  const profile = useAuthStore((s) => s.profile);
  const { data: flatIds, isLoading: flatLoading } = useMyFlatIds();
  const { data: visitors, isLoading: visitorsLoading } = usePendingVisitors(flatIds);
  const { data: expected } = useExpectedToday(flatIds);
  const { data: notices } = useRecentNotices(profile?.society_id);
  const { data: booking } = useUpcomingBooking(profile?.id);
  const topVisitor = visitors?.[0];
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there';

  return (
    <Screen scroll contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <View className="flex-row items-start justify-between">
        <View>
          <Text variant="body" color="textSecondary">
            {greeting()},
          </Text>
          <Text variant="titleLarge">{firstName}</Text>
        </View>
        <BellButton href="/(resident)/(home)/notifications" />
      </View>

      {flatLoading || visitorsLoading ? (
        <SkeletonCard />
      ) : topVisitor ? (
        <LiveVisitorCard visitor={topVisitor} />
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
          <Text variant="caption" color="textSecondary">
            EXPECTED TODAY
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {expected.map((preApproval) => (
              <ExpectedTodayCard key={preApproval.id} preApproval={preApproval} />
            ))}
          </ScrollView>
        </View>
      )}

      {!!notices?.length && (
        <View className="gap-sm">
          <Text variant="caption" color="textSecondary">
            RECENT NOTICES
          </Text>
          {notices.map((notice) => (
            <NoticeStripCard key={notice.id} notice={notice} />
          ))}
        </View>
      )}
    </Screen>
  );
}
