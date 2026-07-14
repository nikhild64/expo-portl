import type { Tables } from '@/types/database';

type ComplaintStatus = Tables<'complaints'>['status'];
type StatusPillTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export function complaintStatusLabel(
  status: ComplaintStatus,
  t: (key: string) => string,
): string {
  switch (status) {
    case 'new':
      return t('resident.complaints.timeline.new');
    case 'assigned':
      return t('resident.complaints.timeline.assigned');
    case 'in_progress':
      return t('resident.complaints.timeline.inProgress');
    case 'resolved':
      return t('resident.complaints.timeline.resolved');
    case 'closed':
      return t('common.closed');
    default:
      return status;
  }
}

export function adminComplaintPrimaryAction(
  status: ComplaintStatus,
  t: (key: string) => string,
): { label: string; status: ComplaintStatus; icon: 'check_circle' | 'arrow_forward' } | null {
  switch (status) {
    case 'assigned':
      return { label: t('status.complaintStart'), status: 'in_progress', icon: 'arrow_forward' };
    case 'in_progress':
      return { label: t('status.complaintResolve'), status: 'resolved', icon: 'check_circle' };
    case 'resolved':
      return { label: t('status.complaintClose'), status: 'closed', icon: 'check_circle' };
    default:
      return null;
  }
}

export function complaintStatusTone(status: ComplaintStatus): StatusPillTone {
  if (status === 'new') return 'info';
  if (status === 'assigned' || status === 'in_progress') return 'warning';
  if (status === 'resolved' || status === 'closed') return 'success';
  return 'neutral';
}
