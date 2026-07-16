jest.mock('@/i18n', () => ({
  __esModule: true,
  default: { t: (key: string) => key },
}));

import { visitorGateStatus, visitorStatusLabel, visitorStatusTone } from './visitorStatus';

describe('visitorGateStatus', () => {
  it('prefers exited_at for OUT status', () => {
    expect(visitorGateStatus({ status: 'entered', entered_at: '2026-01-01', exited_at: '2026-01-02' })).toEqual({
      label: 'status.out',
      tone: 'neutral',
    });
  });

  it('shows IN when entered or status is entered', () => {
    expect(visitorGateStatus({ status: 'approved', entered_at: '2026-01-01' })).toEqual({
      label: 'status.in',
      tone: 'success',
    });
    expect(visitorGateStatus({ status: 'entered' })).toEqual({
      label: 'status.in',
      tone: 'success',
    });
  });

  it('falls back to visitor status display for pending and rejected', () => {
    expect(visitorGateStatus({ status: 'pending' })).toEqual({
      label: 'status.pending',
      tone: 'warning',
      icon: undefined,
    });
    expect(visitorGateStatus({ status: 'rejected' }, { uppercase: true })).toEqual({
      label: 'STATUS.REJECTED',
      tone: 'danger',
      icon: undefined,
    });
  });

  it('covers label and tone helpers', () => {
    expect(visitorStatusLabel('approved')).toBe('status.approved');
    expect(visitorStatusLabel('entered')).toBe('status.entered');
    expect(visitorStatusLabel('exited')).toBe('status.exited');
    expect(visitorStatusLabel('expired')).toBe('status.expired');
    expect(visitorStatusLabel('pending')).toBe('status.pending');
    expect(visitorStatusLabel('rejected')).toBe('status.rejected');

    expect(visitorStatusTone('approved')).toBe('success');
    expect(visitorStatusTone('entered')).toBe('success');
    expect(visitorStatusTone('exited')).toBe('neutral');
    expect(visitorStatusTone('expired')).toBe('neutral');
    expect(visitorStatusTone('pending')).toBe('warning');
    expect(visitorStatusTone('rejected')).toBe('danger');
  });

  it('covers uppercase options for out and in gate statuses', () => {
    expect(visitorGateStatus({ status: 'entered', exited_at: '2026-01-01' }, { uppercase: true })).toEqual({
      label: 'STATUS.OUT',
      tone: 'neutral',
    });
    expect(visitorGateStatus({ status: 'entered' }, { uppercase: true })).toEqual({
      label: 'STATUS.IN',
      tone: 'success',
    });
  });

  it('covers fallback to visitorStatus display for approved and expired in gate status', () => {
    expect(visitorGateStatus({ status: 'expired' })).toEqual({
      label: 'status.expired',
      tone: 'neutral',
      icon: undefined,
    });
    expect(visitorGateStatus({ status: 'approved' })).toEqual({
      label: 'status.approved',
      tone: 'success',
      icon: undefined,
    });
  });
});
