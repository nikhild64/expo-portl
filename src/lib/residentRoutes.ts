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

/** Amenities list — stays inside the active tab stack. */
export function residentAmenitiesHref(segments: readonly string[]): Href {
  const group = residentTabGroup(segments);
  return `/(resident)/${group}/amenities` as Href;
}

/** Amenity booking detail — stays inside the active tab stack. */
export function residentAmenityDetailHref(id: string, segments: readonly string[]): Href {
  const group = residentTabGroup(segments);
  return `/(resident)/${group}/amenities/${id}` as Href;
}

export function residentPreApprovalQrHref(id: string, segments: readonly string[]): Href {
  const group = residentTabGroup(segments);
  if (group === '(home)') return `/(resident)/(home)/preapprove/${id}/qr` as Href;
  return `/(resident)/(approvals)/preapprove/${id}/qr` as Href;
}
