import i18n from '@/i18n';
import { createStatusDisplay } from '@/lib/statusDisplay';
import type { Tables } from '@/types/database';

export type VisitorStatus = Tables<'visitors'>['status'];
export type VisitorStatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const visitorStatus = createStatusDisplay<VisitorStatus>(
  {
    approved: { label: () => i18n.t('status.approved'), tone: 'success' },
    entered: { label: () => i18n.t('status.entered'), tone: 'success' },
    exited: { label: () => i18n.t('status.exited'), tone: 'neutral' },
    expired: { label: () => i18n.t('status.expired'), tone: 'neutral' },
    pending: { label: () => i18n.t('status.pending'), tone: 'warning' },
    rejected: { label: () => i18n.t('status.rejected'), tone: 'danger' },
  },
  { i18nPrefix: 'status', titleizeFallback: true },
);

export const visitorStatusTone = visitorStatus.tone;
export const visitorStatusLabel = visitorStatus.label;

export function visitorGateStatus(
  visitor: {
    status: VisitorStatus;
    entered_at?: string | null;
    exited_at?: string | null;
  },
  options?: { uppercase?: boolean },
): { label: string; tone: VisitorStatusTone } {
  if (visitor.exited_at) {
    const label = i18n.t('status.out');
    return { label: options?.uppercase ? label.toUpperCase() : label, tone: 'neutral' };
  }

  if (visitor.entered_at || visitor.status === 'entered') {
    const label = i18n.t('status.in');
    return { label: options?.uppercase ? label.toUpperCase() : label, tone: 'success' };
  }

  if (visitor.status === 'pending' || visitor.status === 'rejected') {
    return visitorStatus.display(visitor.status, options);
  }

  return visitorStatus.display(visitor.status, options);
}
