import { formatDuesPeriod, formatFlatLabel, formatMoney } from './format';

describe('formatFlatLabel', () => {
  it('returns fallback when flat number is missing', () => {
    expect(formatFlatLabel('Tower A', null)).toBe('Tower A');
    expect(formatFlatLabel(null, null, 'Unassigned')).toBe('Unassigned');
  });

  it('avoids duplicating tower prefix already present in flat number', () => {
    expect(formatFlatLabel('A', 'A-402')).toBe('A-402');
  });

  it('joins tower and flat when needed', () => {
    expect(formatFlatLabel('B', '1204')).toBe('B-1204');
  });
});

describe('formatDuesPeriod', () => {
  it('formats ISO month start as month and year', () => {
    expect(formatDuesPeriod('2026-07-01')).toMatch(/July 2026/);
    expect(formatDuesPeriod('2026-06-01')).toMatch(/June 2026/);
  });
});

describe('formatMoney', () => {
  it('formats INR without decimals', () => {
    expect(formatMoney(8240)).toMatch(/8,?240/);
  });

  it('treats null as zero', () => {
    expect(formatMoney(null)).toMatch(/0/);
  });
});
