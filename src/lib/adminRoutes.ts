import type { Href } from 'expo-router';

import { createRoleRoutes } from '@/lib/createRoleRoutes';

export type AdminTabGroup = '(dashboard)' | '(society)' | '(community)' | '(ops)' | '(menu)';

const TAB_GROUPS: AdminTabGroup[] = ['(dashboard)', '(society)', '(community)', '(ops)', '(menu)'];

const GROUP_ROOT: Record<AdminTabGroup, Href> = {
  '(dashboard)': '/(admin)/(dashboard)',
  '(society)': '/(admin)/(society)',
  '(community)': '/(admin)/(community)',
  '(ops)': '/(admin)/(ops)',
  '(menu)': '/(admin)/(menu)',
};

const { tabGroup: adminTabGroup, href: adminHref } = createRoleRoutes(TAB_GROUPS, '(dashboard)', GROUP_ROOT);

export { adminTabGroup, adminHref };

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
