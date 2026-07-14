import type { Href } from 'expo-router';

import { createRoleRoutes } from '@/lib/createRoleRoutes';

export type GuardTabGroup = '(home)' | '(add)' | '(log)' | '(menu)';

const TAB_GROUPS: GuardTabGroup[] = ['(home)', '(add)', '(log)', '(menu)'];

const GROUP_ROOT: Record<GuardTabGroup, Href> = {
  '(home)': '/(guard)/(home)',
  '(add)': '/(guard)/(add)',
  '(log)': '/(guard)/(log)',
  '(menu)': '/(guard)/(menu)',
};

const { tabGroup: guardTabGroup, href: guardHref } = createRoleRoutes(TAB_GROUPS, '(home)', GROUP_ROOT);

export { guardTabGroup, guardHref };

export function guardIsHomeStack(segments: readonly string[]) {
  return guardTabGroup(segments) === '(home)';
}

export function guardStackRoot(segments: readonly string[]): Href {
  return guardIsHomeStack(segments) ? '/(guard)/(home)' : '/(guard)/(add)';
}

export function guardWaitingBaseHref(
  segments: readonly string[],
): '/(guard)/(home)/waiting' | '/(guard)/(add)/waiting' {
  return guardIsHomeStack(segments) ? '/(guard)/(home)/waiting' : '/(guard)/(add)/waiting';
}

export function guardVerifyHref(segments: readonly string[], visitorId: string): Href {
  const stack = guardIsHomeStack(segments) ? '(home)' : '(add)';
  return { pathname: `/(guard)/${stack}/verify/[visitorId]`, params: { visitorId } };
}

/** Rewrite guard notification deep links to the active tab stack. */
export function guardNotificationHref(url: string, segments: readonly string[]): Href | null {
  if (!segments.includes('(guard)')) return null;

  if (url === '/(guard)/(log)') {
    return '/(guard)/(log)' as Href;
  }

  const notificationsMatch = url.match(/^\/\(guard\)\/\([^)]+\)\/notifications$/);
  if (notificationsMatch) {
    return guardHref(segments, 'notifications');
  }

  const waitingMatch = url.match(/^\/\(guard\)\/\(add\)\/waiting\/([^/]+)$/);
  if (waitingMatch?.[1]) {
    return guardHref(segments, 'waiting', waitingMatch[1]);
  }

  return null;
}
