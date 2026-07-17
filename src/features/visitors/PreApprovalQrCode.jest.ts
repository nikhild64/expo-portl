import { describe, expect, it } from '@jest/globals';

import { formatPreApprovalQrValue } from './PreApprovalQrCode';

describe('formatPreApprovalQrValue', () => {
  it('uppercases the code', () => {
    expect(formatPreApprovalQrValue('portl-abc123')).toBe('PORTL-ABC123');
  });

  it('trims surrounding whitespace', () => {
    expect(formatPreApprovalQrValue('  PORTL-ABC123  ')).toBe('PORTL-ABC123');
  });

  it('handles codes that are already uppercase with no whitespace', () => {
    expect(formatPreApprovalQrValue('PORTL-XYZ789')).toBe('PORTL-XYZ789');
  });
});
