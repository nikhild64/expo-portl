import { router, type Href } from 'expo-router';

import { adminNotificationHref } from '@/lib/adminRoutes';
import { guardNotificationHref } from '@/lib/guardRoutes';
import { getNavigationSegments } from '@/lib/navigationSegmentsStore';
import { residentNotificationHref } from '@/lib/residentRoutes';

export const ALLOWED_ROUTE_PREFIXES = [
  '/(resident)/',
  '/(guard)/',
  '/(admin)/',
  '/(auth)/',
] as const;

export function isAllowedNotificationRoute(url: string): boolean {
  return ALLOWED_ROUTE_PREFIXES.some((prefix) => url.startsWith(prefix));
}

export function resolveNotificationHref(
  url: string,
  segments: readonly string[] = getNavigationSegments(),
): Href | null {
  if (!isAllowedNotificationRoute(url)) return null;

  const adminHref = adminNotificationHref(url, segments);
  if (adminHref) return adminHref;

  const guardHref = guardNotificationHref(url, segments);
  if (guardHref) return guardHref;

  const residentHref = residentNotificationHref(url, segments);
  if (residentHref) return residentHref;

  return url as Href;
}

export function pushNotificationRoute(url: string): void {
  const href = resolveNotificationHref(url);
  if (href) router.push(href);
}
