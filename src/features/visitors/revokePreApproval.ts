import { alert } from '@/lib/alert';

import type { Tables } from '@/types/database';

export function canRevokePreApproval(
  preApproval: Tables<'pre_approvals'>,
  userId?: string | null,
  role?: string | null,
) {
  return preApproval.created_by_profile_id === userId || role === 'admin';
}

export function confirmRevokePreApproval(
  preApproval: Tables<'pre_approvals'>,
  revoke: (id: string) => void,
) {
  alert(
    'Revoke pre-approval?',
    `${preApproval.visitor_name}'s QR code will no longer work at the gate.`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Revoke',
        style: 'destructive',
        onPress: () => revoke(preApproval.id),
      },
    ],
  );
}
