import i18n from '@/i18n';
import { alertConfirmDestructive } from '@/lib/alert';

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
  alertConfirmDestructive(
    i18n.t('alert.titles.revokePreapproval'),
    i18n.t('alert.messages.revokePreapprovalQr', { name: preApproval.visitor_name }),
    () => revoke(preApproval.id),
    { confirmLabel: i18n.t('common.revoke') },
  );
}
