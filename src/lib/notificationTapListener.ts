import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

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

const ALLOWED_ROUTE_PREFIXES = [
  '/(resident)/',
  '/(guard)/',
  '/(admin)/',
  '/(auth)/',
];

function isAllowedRoute(url: string): boolean {
  return ALLOWED_ROUTE_PREFIXES.some((prefix) => url.startsWith(prefix));
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
    // getLastNotificationResponse() is synchronous and returns the response
    // that launched the app when tapped from a killed state.
    const initial = Notifications.getLastNotificationResponse();
    if (initial) {
      const url = extractUrl(initial.notification);
      if (url) {
        // Defer to the next tick so Expo Router has mounted its Slot.
        setTimeout(() => {
          if (isAllowedRoute(url)) router.push(url as never);
          void markAssociatedNotificationRead(initial.notification);
        }, 0);
      }
    }
  }

  responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const url = extractUrl(response.notification);
    if (url && isAllowedRoute(url)) router.push(url as never);
    void markAssociatedNotificationRead(response.notification);
  });

  return () => {
    responseSubscription?.remove();
    responseSubscription = undefined;
  };
}
