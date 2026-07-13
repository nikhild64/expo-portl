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

/** Build a href that stays inside the active tab stack. */
export function residentHref(segments: readonly string[], ...pathParts: string[]): Href {
  const group = residentTabGroup(segments);
  const path = pathParts.filter(Boolean).join('/');
  return `/(resident)/${group}/${path}` as Href;
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
  if (group === '(home)') return `/(resident)/(home)/preapprove/${id}/qr` as Href;
  return `/(resident)/(approvals)/preapprove/${id}/qr` as Href;
}
