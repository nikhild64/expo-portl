import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router, type Href } from 'expo-router';

import { Card, EmptyState, IconSymbol, SkeletonRow, Text } from '@/components';
import type { IconName } from '@/components/IconSymbol';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  type NotificationRow,
} from '@/queries/useNotifications';
import { formatRelativeTime } from '@/lib/format';
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
  const icon = CATEGORY_ICON[row.category] ?? 'notifications';
  const accent = CATEGORY_ACCENT[row.category] ?? 'coral';
  const isUnread = !row.read_at;

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
            {row.title}
          </Text>
          {isUnread && <View className="w-2 h-2 rounded-pill bg-coral" />}
        </View>
        {row.body ? (
          <Text variant="footnote" color="textSecondary" numberOfLines={2}>
            {row.body}
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
  const { data, isLoading, refetch, isRefetching } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const unreadCount = useMemo(
    () => (data ?? []).filter((row) => !row.read_at).length,
    [data],
  );

  const handleTap = (row: NotificationRow) => {
    if (!row.read_at) markRead.mutate(row.id);
    const url = (row.data as { url?: string } | null)?.url;
    if (typeof url === 'string' && url.length > 0) router.push(url as Href);
  };

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
      {unreadCount > 0 && (
        <View className="px-base pt-sm pb-xs flex-row items-center justify-between">
          <Text variant="caption" color="textSecondary">
            {unreadCount} unread
          </Text>
          <Pressable onPress={() => markAll.mutate()} hitSlop={8}>
            <Text variant="footnote" color="coral">
              Mark all read
            </Text>
          </Pressable>
        </View>
      )}
      <FlashList
        data={data ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <NotificationRowView row={item} onPress={handleTap} />}
        ItemSeparatorComponent={() => <View className="h-px bg-border ml-16" />}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListEmptyComponent={
          <View className="px-base pt-xl">
            <Card>
              <EmptyState
                icon="notifications"
                title="No notifications yet"
                subtitle="You will see visitor requests, notices, complaints, and payment updates here."
              />
            </Card>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 96 }}
      />
    </View>
  );
}
