jest.mock('@/i18n', () => ({
  __esModule: true,
  default: { t: (key: string) => key },
}));

import { paymentStatusIcon, paymentStatusLabel, paymentStatusTone } from './paymentStatus';

describe('paymentStatus', () => {
  it('maps each payment status to a label', () => {
    expect(paymentStatusLabel('processing')).toBe('resident.payments.processing');
    expect(paymentStatusLabel('failed')).toBe('resident.payments.paymentFailed');
    expect(paymentStatusLabel('paid')).toBe('resident.payments.paid');
    expect(paymentStatusLabel('cancelled')).toBe('resident.payments.cancelledStatus');
    expect(paymentStatusLabel('clear')).toBe('resident.payments.clear');
  });

  it('maps each payment status to a tone', () => {
    expect(paymentStatusTone('processing')).toBe('warning');
    expect(paymentStatusTone('failed')).toBe('danger');
    expect(paymentStatusTone('paid')).toBe('success');
    expect(paymentStatusTone('cancelled')).toBe('neutral');
    expect(paymentStatusTone('clear')).toBe('success');
  });

  it('maps each payment status to an icon', () => {
    expect(paymentStatusIcon('processing')).toBe('schedule');
    expect(paymentStatusIcon('failed')).toBe('error_outline');
    expect(paymentStatusIcon('paid')).toBe('check_circle');
    expect(paymentStatusIcon('cancelled')).toBe('cancel');
    expect(paymentStatusIcon('clear')).toBe('check_circle');
  });
});
