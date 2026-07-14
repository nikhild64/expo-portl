import type { Href } from 'expo-router';

import { createRoleRoutes } from '@/lib/createRoleRoutes';

export type ResidentTabGroup = '(home)' | '(approvals)' | '(community)' | '(payments)' | '(menu)';

const TAB_GROUPS: ResidentTabGroup[] = ['(home)', '(approvals)', '(community)', '(payments)', '(menu)'];

const GROUP_ROOT: Record<ResidentTabGroup, Href> = {
  '(home)': '/(resident)/(home)',
  '(approvals)': '/(resident)/(approvals)',
  '(community)': '/(resident)/(community)',
  '(payments)': '/(resident)/(payments)',
  '(menu)': '/(resident)/(menu)',
};

const { tabGroup: residentTabGroup, href: residentHref } = createRoleRoutes(TAB_GROUPS, '(menu)', GROUP_ROOT);

export { residentTabGroup, residentHref };

export function residentPreApprovalQrHref(id: string, segments: readonly string[]): Href {
  const group = residentTabGroup(segments);
  if (group === '(home)') {
    return { pathname: '/(resident)/(home)/preapprove/[id]/qr', params: { id } };
  }
  return { pathname: '/(resident)/(approvals)/preapprove/[id]/qr', params: { id } };
}

/** Visitor approval detail — home stack unless already on Approvals tab. */
export function residentApprovalHref(id: string, segments: readonly string[]): Href {
  if (residentTabGroup(segments) === '(approvals)') {
    return { pathname: '/(resident)/(approvals)/[id]', params: { id } };
  }
  return { pathname: '/(resident)/(home)/approvals/[id]', params: { id } };
}

function residentSegmentsForNotification(segments: readonly string[]): readonly string[] {
  if (segments.includes('(resident)')) return segments;
  return ['(resident)', '(home)'];
}

/** Rewrite resident notification deep links to the active tab stack. */
export function residentNotificationHref(url: string, segments: readonly string[]): Href | null {
  const residentSegments = residentSegmentsForNotification(segments);

  const approvalMatch = url.match(/^\/\(resident\)\/\(approvals\)\/([^/]+)$/);
  if (approvalMatch?.[1]) {
    return residentApprovalHref(approvalMatch[1], residentSegments);
  }

  const homeApprovalMatch = url.match(/^\/\(resident\)\/\(home\)\/approvals\/([^/]+)$/);
  if (homeApprovalMatch?.[1]) {
    return residentApprovalHref(homeApprovalMatch[1], residentSegments);
  }

  const complaintMatch = url.match(/^\/\(resident\)\/\(menu\)\/complaints\/([^/]+)$/);
  if (complaintMatch?.[1]) {
    return residentHref(residentSegments, 'complaints', complaintMatch[1]);
  }

  if (url === '/(resident)/(payments)') {
    return residentHref(residentSegments, 'payments');
  }

  const noticeMatch = url.match(/^\/\(resident\)\/\(community\)\/notices\/([^/]+)$/);
  if (noticeMatch?.[1]) {
    if (residentTabGroup(residentSegments) === '(home)') {
      return { pathname: '/(resident)/(home)/notices/[id]', params: { id: noticeMatch[1] } };
    }
    return { pathname: '/(resident)/(community)/notices/[id]', params: { id: noticeMatch[1] } };
  }

  if (url.match(/^\/\(resident\)\/\([^)]+\)\/notifications$/)) {
    return residentHref(residentSegments, 'notifications');
  }

  return null;
}
