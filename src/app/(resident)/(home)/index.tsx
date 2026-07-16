import { useMemo, useRef } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Avatar, Card, EmptyState, Screen, Text } from '@/components';
import { BookingDetailSheet, type BookingDetailSheetHandle } from '@/features/amenities/BookingDetailSheet';
import { QuickActions } from '@/features/home/QuickActions';
import { SosPanicButton } from '@/features/home/SosPanicButton';
import { BellButton } from '@/features/notifications/BellButton';
import { NoticeStripCard } from '@/features/notices/NoticeStripCard';
import { ExpectedTodayCard } from '@/features/visitors/ExpectedTodayCard';
import { PendingVisitorsStrip } from '@/features/visitors/PendingVisitorsStrip';
import { canRevokePreApproval, confirmRevokePreApproval } from '@/features/visitors/revokePreApproval';
import { formatDateTime, formatFirstName, greeting } from '@/lib/format';
import { useResidentNavigation } from '@/lib/useResidentNavigation';
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
  const { t } = useTranslation();
  const bookingSheetRef = useRef<BookingDetailSheetHandle>(null);
  const residentNav = useResidentNavigation();
  const profile = useAuthStore((s) => s.profile);
  const userId = useAuthStore((s) => s.session?.user.id);
  const { refreshing, refresh } = useHomeRefresh();
  const revokePreApproval = useRevokePreApproval();
  const { data: flatIds, isLoading: flatLoading } = useMyFlatIds();
  const { data: visitors, isLoading: visitorsLoading } = usePendingVisitors(flatIds);
  const { data: expected } = useExpectedToday(flatIds);
  const { data: notices } = useRecentNotices(profile?.society_id);
  const { data: booking } = useUpcomingBooking(profile?.id);
  const firstName = formatFirstName(profile?.full_name, t('format.greetingFallback'));
  const openAmenity = useMemo(
    () => (id: string) => residentNav.push('amenities', id),
    [residentNav],
  );

  return (
    <>
    <Screen scroll variant="tab" safeTop refreshing={refreshing} onRefresh={refresh}>
      <View className="flex-row items-start justify-between">
        <View>
          <Text variant="body" color="textSecondary">
            {greeting()},
          </Text>
          <Text variant="titleLarge">{firstName}</Text>
        </View>
        <View className="flex-row items-center gap-sm">
          <BellButton href={residentNav.href('notifications')} />
          <Pressable
            onPress={() => residentNav.push('profile')}
            accessibilityRole="button"
            accessibilityLabel={t('a11y.openProfile')}
          >
            <Avatar name={profile?.full_name ?? t('nav.screens.resident')} uri={profile?.avatar_url ?? undefined} size="md" />
          </Pressable>
        </View>
      </View>

      <SosPanicButton />

      {flatLoading || visitorsLoading ? (
        <PendingVisitorsStrip loading />
      ) : visitors?.length ? (
        <PendingVisitorsStrip
          visitors={visitors}
          // Cross-tab: no approvals root re-export in home stack — switch to Approvals tab.
          onSeeAll={visitors.length > 1 ? () => router.push('/(resident)/(approvals)') : undefined}
        />
      ) : (
        <EmptyState
          icon="verified_user"
          title={t('resident.home.noVisitorsWaiting')}
          subtitle={t('resident.home.noVisitorsWaitingSub')}
        />
      )}

      <QuickActions />

      {booking && (
        <Pressable
          onPress={() => bookingSheetRef.current?.open(booking)}
          accessibilityRole="button"
        >
          <Card variant="outlined" className="gap-xs">
            <Text variant="caption" color="textSecondary">
              {t('resident.home.upcomingBooking')}
            </Text>
            <Text variant="headline">{booking.amenities?.name ?? t('resident.amenities.amenityBooking')}</Text>
            <Text variant="footnote" color="textSecondary">
              {formatDateTime(booking.start_at)}
            </Text>
          </Card>
        </Pressable>
      )}

      {!!expected?.length && (
        <View className="gap-sm">
          <View className="flex-row items-center justify-between">
            <Text variant="caption" color="textSecondary">
              {t('resident.home.expectedToday')}
            </Text>
            <Text
              variant="caption"
              color="coral"
              // Cross-tab: no approvals root re-export in home stack — switch to Approvals tab.
              onPress={() => router.push('/(resident)/(approvals)')}
            >
              {t('common.seeAll')}
            </Text>
          </View>
          <View className="gap-sm">
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
          </View>
        </View>
      )}

      {!!notices?.length && (
        <View className="gap-sm">
          <View className="flex-row items-center justify-between">
            <Text variant="caption" color="textSecondary">
              {t('resident.home.recentNotices')}
            </Text>
            <Text
              variant="caption"
              color="coral"
              // Cross-tab: no community hub re-export in home stack — switch to Community tab.
              onPress={() => router.push('/(resident)/(community)')}
            >
              {t('common.viewAll')}
            </Text>
          </View>
          {notices.map((notice) => (
            <NoticeStripCard key={notice.id} notice={notice} />
          ))}
        </View>
      )}
    </Screen>
    {booking ? <BookingDetailSheet ref={bookingSheetRef} onBookAgain={openAmenity} /> : null}
    </>
  );
}
