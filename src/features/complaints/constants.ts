import type { IconName } from '@/components/IconSymbol';

export type ComplaintScope = 'mine' | 'society';
export type ComplaintStatusFilter = 'active' | 'resolved' | 'all';
export type ComplaintCategoryFilter = 'all' | (typeof COMPLAINT_CATEGORIES)[number];

export const COMPLAINT_CATEGORIES = [
  'plumbing',
  'electrical',
  'housekeeping',
  'security',
  'parking',
  'other',
] as const;

export const COMPLAINT_CATEGORY_ICONS: Record<(typeof COMPLAINT_CATEGORIES)[number], IconName> = {
  plumbing: 'water_drop',
  electrical: 'lightbulb',
  housekeeping: 'cleaning_services',
  security: 'lock',
  parking: 'directions_car',
  other: 'info',
};

export const ACTIVE_STATUSES = ['new', 'assigned', 'in_progress'] as const;
export const RESOLVED_STATUSES = ['resolved', 'closed'] as const;
