import type { Href } from 'expo-router';

export type ResidentTabGroup = '(home)' | '(approvals)' | '(community)' | '(payments)' | '(menu)';

const TAB_GROUPS: ResidentTabGroup[] = ['(home)', '(approvals)', '(community)', '(payments)', '(menu)'];

/** Which resident tab stack is currently active. */
export function residentTabGroup(segments: readonly string[]): ResidentTabGroup {
  for (const group of TAB_GROUPS) {
    if (segments.includes(group)) return group;
  }
  return '(menu)';
}

const GROUP_ROOT: Record<ResidentTabGroup, Href> = {
  '(home)': '/(resident)/(home)',
  '(approvals)': '/(resident)/(approvals)',
  '(community)': '/(resident)/(community)',
  '(payments)': '/(resident)/(payments)',
  '(menu)': '/(resident)/(menu)',
};

/** Build a href that stays inside the active tab stack. */
export function residentHref(segments: readonly string[], ...pathParts: string[]): Href {
  const group = residentTabGroup(segments);
  const path = pathParts.filter(Boolean).join('/');
  if (!path) return GROUP_ROOT[group];
  return `${GROUP_ROOT[group]}/${path}` as Href;
}

/** Amenities list — stays inside the active tab stack. */
export function residentAmenitiesHref(segments: readonly string[]): Href {
  return residentHref(segments, 'amenities');
}

/** Amenity booking detail — stays inside the active tab stack. */
export function residentAmenityDetailHref(id: string, segments: readonly string[]): Href {
  return residentHref(segments, 'amenities', id);
}

export function residentProfileHref(segments: readonly string[]): Href {
  return residentHref(segments, 'profile');
}

export function residentPreApprovalQrHref(id: string, segments: readonly string[]): Href {
  const group = residentTabGroup(segments);
  if (group === '(home)') {
    return { pathname: '/(resident)/(home)/preapprove/[id]/qr', params: { id } };
  }
  return { pathname: '/(resident)/(approvals)/preapprove/[id]/qr', params: { id } };
}
