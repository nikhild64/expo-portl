import i18n from '@/i18n';
import type { Tables } from '@/types/database';

export function getComplaintQuickActions(status: Tables<'complaints'>['status']) {
  const t = i18n.t.bind(i18n);

  switch (status) {
    case 'new':
      return [
        { label: t('status.complaintAssign'), status: 'assigned' as const },
        { label: t('status.complaintStart'), status: 'in_progress' as const },
      ];
    case 'assigned':
      return [{ label: t('status.complaintStart'), status: 'in_progress' as const }];
    case 'in_progress':
      return [{ label: t('status.complaintResolve'), status: 'resolved' as const }];
    case 'resolved':
      return [{ label: t('status.complaintClose'), status: 'closed' as const }];
    case 'closed':
      return [];
  }
}
