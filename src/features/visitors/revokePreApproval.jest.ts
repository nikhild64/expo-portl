import type { Tables } from '@/types/database';
import { describe, expect, it, jest } from '@jest/globals';

import { canRevokePreApproval, confirmRevokePreApproval } from './revokePreApproval';

jest.mock('@/i18n', () => ({
  __esModule: true,
  default: { t: (key: string, options?: any) => key + (options ? `:${JSON.stringify(options)}` : '') },
}));

const mockAlertConfirmDestructive = jest.fn();
jest.mock('@/lib/alert', () => ({
  alertConfirmDestructive: (...args: any[]) => mockAlertConfirmDestructive(...args),
}));

function preApproval(createdBy: string): Tables<'pre_approvals'> {
  return {
    code: 'PORTL-ABC123',
    created_at: '2026-01-01T00:00:00.000Z',
    created_by_profile_id: createdBy,
    end_at: '2026-01-02T00:00:00.000Z',
    flat_id: 'flat-1',
    id: 'pre-1',
    notes: null,
    qr_used_at: null,
    recurring: false,
    start_at: '2026-01-01T00:00:00.000Z',
    type: 'guest',
    vehicle_plate: null,
    visitor_name: 'Alex',
    visitor_phone: null,
  };
}

describe('canRevokePreApproval', () => {
  it('allows the creator to revoke', () => {
    expect(canRevokePreApproval(preApproval('user-1'), 'user-1', 'resident')).toBe(true);
  });

  it('allows admins to revoke any pre-approval', () => {
    expect(canRevokePreApproval(preApproval('user-1'), 'user-2', 'admin')).toBe(true);
  });

  it('denies other residents', () => {
    expect(canRevokePreApproval(preApproval('user-1'), 'user-2', 'resident')).toBe(false);
  });

  it('denies when user id is missing', () => {
    expect(canRevokePreApproval(preApproval('user-1'), null, 'resident')).toBe(false);
    expect(canRevokePreApproval(preApproval('user-1'), undefined, 'resident')).toBe(false);
  });
});

describe('confirmRevokePreApproval', () => {
  it('calls alertConfirmDestructive and triggers revoke on confirm', () => {
    const revoke = jest.fn();
    const item = preApproval('user-1');

    confirmRevokePreApproval(item, revoke);

    expect(mockAlertConfirmDestructive).toHaveBeenCalledWith(
      'alert.titles.revokePreapproval',
      'alert.messages.revokePreapprovalQr:{"name":"Alex"}',
      expect.any(Function),
      { confirmLabel: 'common.revoke' },
    );

    const onConfirm = mockAlertConfirmDestructive.mock.calls[0]?.[2] as () => void;
    onConfirm();

    expect(revoke).toHaveBeenCalledWith('pre-1');
  });
});
