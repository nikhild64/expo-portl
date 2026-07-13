import type { Tables } from '@/types/database';

export function getComplaintQuickActions(status: Tables<'complaints'>['status']) {
  switch (status) {
    case 'new':
      return [
        { label: 'Assign', status: 'assigned' as const },
        { label: 'Start', status: 'in_progress' as const },
      ];
    case 'assigned':
      return [{ label: 'Start', status: 'in_progress' as const }];
    case 'in_progress':
      return [{ label: 'Resolve', status: 'resolved' as const }];
    case 'resolved':
      return [{ label: 'Close', status: 'closed' as const }];
    case 'closed':
      return [];
  }
}
