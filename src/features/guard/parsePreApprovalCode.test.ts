import {
  formatPreApprovalCodeFromSuffix,
  isPreApprovalCodeSuffix,
  parsePreApprovalCode,
  sanitizePreApprovalCodeSuffix,
} from './parsePreApprovalCode';

describe('parsePreApprovalCode', () => {
  it('accepts plain PORTL codes', () => {
    expect(parsePreApprovalCode(' portl-abc123 ')).toBe('PORTL-ABC123');
  });

  it('accepts legacy deep links', () => {
    expect(parsePreApprovalCode('portl-nd://gate?code=PORTL-XYZ789')).toBe('PORTL-XYZ789');
  });

  it('rejects invalid values', () => {
    expect(parsePreApprovalCode('')).toBeNull();
    expect(parsePreApprovalCode('PORTL-ABC')).toBeNull();
    expect(parsePreApprovalCode('https://example.com')).toBeNull();
    expect(parsePreApprovalCode('portl-nd://other?code=invalid')).toBeNull();
    expect(parsePreApprovalCode('portl-nd://gate')).toBeNull();
    expect(parsePreApprovalCode('portl-nd://gate?code=')).toBeNull();
    expect(parsePreApprovalCode('portl-nd://gate?code=PORTL-123')).toBeNull();
  });

  it('extracts embedded codes even when the deep link host is wrong', () => {
    expect(parsePreApprovalCode('portl-nd://other?code=PORTL-ABC123')).toBe('PORTL-ABC123');
  });
});

describe('pre-approval suffix helpers', () => {
  it('validates and formats suffixes', () => {
    expect(isPreApprovalCodeSuffix('abc123')).toBe(true);
    expect(formatPreApprovalCodeFromSuffix('abc123')).toBe('PORTL-ABC123');
    expect(formatPreApprovalCodeFromSuffix('bad')).toBeNull();
  });

  it('sanitizes suffix input', () => {
    expect(sanitizePreApprovalCodeSuffix('ab-12!3xy')).toBe('AB123X');
  });
});
