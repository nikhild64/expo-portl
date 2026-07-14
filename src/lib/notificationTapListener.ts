import * as Notifications from 'expo-notifications';

import { pushNotificationRoute } from '@/lib/notificationRoutes';
import { supabase } from './supabase';

type Subscription = ReturnType<typeof Notifications.addNotificationResponseReceivedListener>;

let responseSubscription: Subscription | undefined;
let handledColdStart = false;

function extractUrl(notification: Notifications.Notification): string | undefined {
  const url = notification.request.content.data?.url;
  return typeof url === 'string' && url.length > 0 ? url : undefined;
}

async function markAssociatedNotificationRead(notification: Notifications.Notification) {
  const notificationId = notification.request.content.data?.notificationId;
  if (typeof notificationId !== 'string' || !notificationId) return;
  try {
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .is('read_at', null);
  } catch {
    // best-effort; the in-app list will still refresh on focus
  }
}

/**
 * Subscribes the app to notification tap events and consumes the cold-start
 * notification response so a killed-state tap also deep links correctly.
 *
 * Returns an unsubscribe function suitable for a `useEffect` cleanup.
 */
export function subscribeToNotificationTaps(): () => void {
  responseSubscription?.remove();

  if (!handledColdStart) {
    handledColdStart = true;
    const initial = Notifications.getLastNotificationResponse();
    if (initial) {
      const url = extractUrl(initial.notification);
      if (url) {
        setTimeout(() => {
          pushNotificationRoute(url);
          void markAssociatedNotificationRead(initial.notification);
        }, 0);
      }
    }
  }

  responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const url = extractUrl(response.notification);
    if (url) pushNotificationRoute(url);
    void markAssociatedNotificationRead(response.notification);
  });

  return () => {
    responseSubscription?.remove();
    responseSubscription = undefined;
  };
}
