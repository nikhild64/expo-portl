import type { Href } from 'expo-router';

import { createRoleRoutes } from '@/lib/createRoleRoutes';

export type GuardTabGroup = '(home)' | '(log)' | '(menu)';

const TAB_GROUPS: GuardTabGroup[] = ['(home)', '(log)', '(menu)'];

const GROUP_ROOT: Record<GuardTabGroup, Href> = {
  '(home)': '/(guard)/(home)',
  '(log)': '/(guard)/(log)',
  '(menu)': '/(guard)/(menu)',
};

const { tabGroup: guardTabGroup, href: guardHref } = createRoleRoutes(TAB_GROUPS, '(home)', GROUP_ROOT);

export { guardTabGroup, guardHref };

export function guardStackRoot(_segments?: readonly string[]): Href {
  return '/(guard)/(home)';
}

export function guardNewEntryHref(_segments?: readonly string[]): '/(guard)/(home)/new' {
  return '/(guard)/(home)/new';
}

export function guardVerifyHref(_segments: readonly string[], visitorId: string): Href {
  return { pathname: '/(guard)/(home)/verify/[visitorId]', params: { visitorId } };
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

  const waitingMatch = url.match(/^\/\(guard\)\/\((?:home|add)\)\/waiting\/([^/]+)$/);
  if (waitingMatch?.[1]) {
    return `/(guard)/(home)/waiting/${waitingMatch[1]}` as Href;
  }

  return null;
}
