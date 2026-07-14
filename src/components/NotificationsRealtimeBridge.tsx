import { useNotificationsRealtime } from '@/queries/useNotificationsRealtime';
import { useNoticesRealtime } from '@/queries/useNoticesRealtime';

export function NotificationsRealtimeBridge() {
  useNotificationsRealtime();
  useNoticesRealtime();
  return null;
}
