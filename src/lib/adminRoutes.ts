import type { Href } from 'expo-router';

export type AdminTabGroup = '(dashboard)' | '(society)' | '(community)' | '(ops)' | '(menu)';

const TAB_GROUPS: AdminTabGroup[] = ['(dashboard)', '(society)', '(community)', '(ops)', '(menu)'];

export function adminTabGroup(segments: readonly string[]): AdminTabGroup {
  for (const group of TAB_GROUPS) {
    if (segments.includes(group)) return group;
  }
  return '(dashboard)';
}

const GROUP_ROOT: Record<AdminTabGroup, Href> = {
  '(dashboard)': '/(admin)/(dashboard)',
  '(society)': '/(admin)/(society)',
  '(community)': '/(admin)/(community)',
  '(ops)': '/(admin)/(ops)',
  '(menu)': '/(admin)/(menu)',
};

/** Build a href that stays inside the active admin tab stack. */
export function adminHref(segments: readonly string[], ...pathParts: string[]): Href {
  const group = adminTabGroup(segments);
  const path = pathParts.filter(Boolean).join('/');
  if (!path) return GROUP_ROOT[group];
  return `${GROUP_ROOT[group]}/${path}` as Href;
}

/** Rewrite admin notification deep links to the active tab stack. */
export function adminNotificationHref(url: string, segments: readonly string[]): Href | null {
  if (!segments.includes('(admin)')) return null;

  const complaintMatch = url.match(/^\/\(admin\)\/\(ops\)\/complaints\/([^/]+)$/);
  if (complaintMatch?.[1]) {
    return adminHref(segments, 'complaints', complaintMatch[1]);
  }

  if (url === '/(admin)/(society)/pending') {
    return adminHref(segments, 'pending');
  }

  return null;
}
