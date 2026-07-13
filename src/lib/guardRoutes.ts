import type { Href } from 'expo-router';

export type GuardTabGroup = '(home)' | '(add)' | '(log)' | '(menu)';

const TAB_GROUPS: GuardTabGroup[] = ['(home)', '(add)', '(log)', '(menu)'];

export function guardTabGroup(segments: readonly string[]): GuardTabGroup {
  for (const group of TAB_GROUPS) {
    if (segments.includes(group)) return group;
  }
  return '(home)';
}

const GROUP_ROOT: Record<GuardTabGroup, Href> = {
  '(home)': '/(guard)/(home)',
  '(add)': '/(guard)/(add)',
  '(log)': '/(guard)/(log)',
  '(menu)': '/(guard)/(menu)',
};

/** Build a href that stays inside the active guard tab stack. */
export function guardHref(segments: readonly string[], ...pathParts: string[]): Href {
  const group = guardTabGroup(segments);
  const path = pathParts.filter(Boolean).join('/');
  if (!path) return GROUP_ROOT[group];
  return `${GROUP_ROOT[group]}/${path}` as Href;
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
