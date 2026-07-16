import { useCallback, useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useIsFocused } from '@react-navigation/native';
import { router, useSegments } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Card, EmptyState, IconSymbol, SkeletonRow, Text } from '@/components';
import { HairlineSeparator } from '@/components/listSeparators';
import type { IconName } from '@/components/IconSymbol';
import { isAllowedNotificationRoute, resolveNotificationHref } from '@/lib/notificationRoutes';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  type NotificationRow,
} from '@/queries/useNotifications';
import { formatRelativeTime } from '@/lib/format';
import { parseNotificationData, resolveNotificationDisplay } from '@/lib/notificationTemplates';
import type { ThemeColor } from '@/theme';

const CATEGORY_ICON: Record<string, IconName> = {
  'visitor-approval': 'verified_user',
  notices: 'campaign',
  polls: 'poll',
  complaints: 'construction',
  payments: 'credit_card',
  payment: 'credit_card',
};

const CATEGORY_ACCENT: Record<string, ThemeColor> = {
  'visitor-approval': 'coral',
  notices: 'info',
  polls: 'coral',
  complaints: 'warning',
  payments: 'success',
  payment: 'success',
};

function NotificationRowView({
  row,
  onPress,
}: {
  row: NotificationRow;
  onPress: (row: NotificationRow) => void;
}) {
  const { t } = useTranslation();
  const icon = CATEGORY_ICON[row.category] ?? 'notifications';
  const accent = CATEGORY_ACCENT[row.category] ?? 'coral';
  const isUnread = !row.read_at;
  const display = resolveNotificationDisplay(
    t,
    { title: row.title, body: row.body },
    parseNotificationData(row.data),
  );

  return (
    <Pressable
      onPress={() => onPress(row)}
      android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
      className={`flex-row gap-md px-base py-md ${isUnread ? 'bg-surface-secondary' : 'bg-surface'}`}
    >
      <View className="w-10 h-10 rounded-pill bg-surface-tertiary items-center justify-center">
        <IconSymbol name={icon} color={accent} />
      </View>
      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center gap-sm">
          <Text variant="headline" className="flex-1" numberOfLines={2}>
            {display.title}
          </Text>
          {isUnread && <View className="w-2 h-2 rounded-pill bg-coral" />}
        </View>
        {display.body ? (
          <Text variant="footnote" color="textSecondary" numberOfLines={2}>
            {display.body}
          </Text>
        ) : null}
        <Text variant="caption" color="textTertiary">
          {formatRelativeTime(row.created_at)}
        </Text>
      </View>
    </Pressable>
  );
}

export function NotificationList() {
  const { t } = useTranslation();
  const segments = useSegments();
  const { data, isLoading, refetch, isRefetching } = useNotifications();
  const isFocused = useIsFocused();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  useEffect(() => {
    if (!isFocused || isLoading) return;
    const hasUnread = data?.some((row) => !row.read_at);
    if (!hasUnread) return;
    markAll.mutate();
  }, [isFocused, data, isLoading, markAll]);

  const handleTap = useCallback(
    (row: NotificationRow) => {
      if (!row.read_at) markRead.mutate(row.id);
      const url = (row.data as { url?: string } | null)?.url;
      if (typeof url !== 'string' || url.length === 0 || !isAllowedNotificationRoute(url)) return;

      const href = resolveNotificationHref(url, segments);
      if (!href) return;
      router.push(href);
    },
    [markRead, segments],
  );

  const renderItem = useCallback(
    ({ item }: { item: NotificationRow }) => <NotificationRowView row={item} onPress={handleTap} />,
    [handleTap],
  );

  if (isLoading) {
    return (
      <View className="gap-sm py-md">
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </View>
    );
  }

  return (
    <View className="flex-1">
      <FlashList
        data={data ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={HairlineSeparator}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListEmptyComponent={
          <View className="px-base pt-xl">
            <Card>
              <EmptyState
                icon="notifications"
                title={t('resident.notifications.noNotifications')}
                subtitle={t('resident.notifications.noNotificationsSub')}
              />
            </Card>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 96 }}
      />
    </View>
  );
}
