import * as Notifications from 'expo-notifications';

import { invalidateQueriesForNotificationCategory } from '@/lib/notificationQueryInvalidation';
import { queryClient } from '@/lib/queryClient';

type Subscription = ReturnType<typeof Notifications.addNotificationReceivedListener>;

let receivedSubscription: Subscription | undefined;

function categoryFromNotification(notification: Notifications.Notification): string | undefined {
  const channelId = notification.request.content.data?.channelId;
  return typeof channelId === 'string' && channelId.length > 0 ? channelId : undefined;
}

/**
 * Refreshes related React Query caches when a push arrives while the app is open.
 * Supabase realtime on `notifications` handles the in-app tile; this covers Expo push delivery too.
 */
export function subscribeToNotificationReceived(): () => void {
  receivedSubscription?.remove();

  receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
    invalidateQueriesForNotificationCategory(queryClient, categoryFromNotification(notification));
  });

  return () => {
    receivedSubscription?.remove();
    receivedSubscription = undefined;
  };
}
