jest.mock('@/i18n', () => ({
  __esModule: true,
  default: { t: (key: string) => key, language: 'en' },
}));

import {
  endOfMonthDate,
  endOfTodayIso,
  endOfYesterdayIso,
  formatAssigneeLabel,
  formatAssigneeRole,
  formatCompactNumber,
  formatDate,
  formatDateShort,
  formatDateTime,
  formatDateTimeWithWeekday,
  formatDateWithWeekday,
  formatDayOfMonth,
  formatDuesPeriod,
  formatFirstName,
  formatFlatLabel,
  formatHourLabel,
  formatMoney,
  formatRelativeTime,
  formatTicketNumber,
  formatTime,
  formatTimeRange,
  formatWeekdayShort,
  greeting,
  maskPhone,
  startOfCurrentMonthIso,
  startOfDaysAgoIso,
  startOfMonthDate,
  startOfTodayIso,
  startOfYesterdayIso,
  titleize,
  toDate,
  visitorLogRangeBounds,
} from './format';

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

  it('returns not-set for missing values', () => {
    expect(formatDuesPeriod(null)).toBe('format.notSet');
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

describe('format helpers', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-15T14:30:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('parses dates from strings and Date objects', () => {
    const date = new Date('2026-07-15T10:00:00.000Z');
    expect(toDate('2026-07-15T10:00:00.000Z').toISOString()).toBe(date.toISOString());
    expect(toDate(date)).toBe(date);
  });

  it('masks phone numbers', () => {
    expect(maskPhone('9876543210')).toMatch(/98••• ••210/);
    expect(maskPhone('123')).toBe('123');
    expect(maskPhone(null)).toBe('format.phoneNotShared');
  });

  it('formats compact numbers', () => {
    expect(formatCompactNumber(1500)).toBe('1.5k');
    expect(formatCompactNumber(250000)).toBe('2.5L');
    expect(formatCompactNumber(15000000)).toBe('1.5Cr');
    expect(formatCompactNumber(-1200)).toBe('-1.2k');
  });

  it('titleizes and formats first names', () => {
    expect(titleize('in_progress')).toBe('In Progress');
    expect(formatFirstName('Alex Resident')).toBe('Alex');
    expect(formatFirstName(null, 'Guest')).toBe('Guest');
  });

  it('formats assignee labels', () => {
    expect(
      formatAssigneeLabel({
        full_name: 'Sam',
        kind: 'profile',
        role: 'admin',
      }),
    ).toBe('Sam (Admin)');
    expect(
      formatAssigneeRole({
        full_name: 'Vendor',
        kind: 'service_provider',
        role: 'admin',
        category: 'plumber',
      }),
    ).toBe('Plumber');
  });

  it('formats date and time values', () => {
    const iso = '2026-07-15T10:30:00.000Z';
    expect(formatDateTime(iso)).toMatch(/15/);
    expect(formatDateTimeWithWeekday(iso)).toMatch(/15/);
    expect(formatDate(iso)).toMatch(/2026/);
    expect(formatDateWithWeekday(iso)).toMatch(/2026/);
    expect(formatTime(iso)).toMatch(/:/);
    expect(formatHourLabel(9)).toMatch(/9/);
    expect(formatWeekdayShort(iso)).toBeTruthy();
    expect(formatDayOfMonth(iso)).toBe('15');
    expect(formatDateShort(iso)).toMatch(/15/);
    expect(formatTimeRange('2026-07-15T09:00:00.000Z', '2026-07-15T11:00:00.000Z')).toMatch(/–/);
    expect(formatDateTime(null)).toBe('format.notSet');
    expect(formatDate('invalid')).toBe('format.notSet');
  });

  it('formats relative time buckets', () => {
    jest.setSystemTime(new Date('2026-07-15T14:30:00.000Z'));
    expect(formatRelativeTime(new Date('2026-07-15T14:29:30.000Z'))).toBe('format.justNow');
    expect(formatRelativeTime(new Date('2026-07-15T12:00:00.000Z'))).toMatch(/ago|पहले/);
    expect(formatRelativeTime(new Date('2026-07-14T12:00:00.000Z'))).toBe('format.yesterday');
    expect(formatRelativeTime(new Date('2026-07-10T12:00:00.000Z'))).toMatch(/10/);
    expect(formatRelativeTime(null)).toBe('format.notSet');
  });

  it('builds ISO range helpers', () => {
    expect(new Date(startOfTodayIso()).getHours()).toBe(0);
    expect(new Date(endOfTodayIso()).getHours()).toBe(23);
    expect(new Date(startOfYesterdayIso()).getDate()).toBe(14);
    expect(new Date(endOfYesterdayIso()).getDate()).toBe(14);
    expect(new Date(startOfDaysAgoIso(3)).getDate()).toBe(12);
    expect(new Date(startOfCurrentMonthIso()).getDate()).toBe(1);

    const month = new Date(2026, 6, 15);
    expect(startOfMonthDate(month)).toBe(new Date(2026, 6, 1).toISOString().slice(0, 10));
    expect(endOfMonthDate(month)).toBe(new Date(2026, 6 + 1, 0).toISOString().slice(0, 10));
  });

  it('creates stable ticket numbers', () => {
    expect(formatTicketNumber('11111111-2222-3333-4444-555555555555')).toMatch(/^#\d{4}$/);
  });

  it('returns greeting by time of day', () => {
    jest.setSystemTime(new Date(2026, 6, 15, 8, 0, 0));
    expect(greeting()).toBe('format.goodMorning');
    jest.setSystemTime(new Date(2026, 6, 15, 14, 0, 0));
    expect(greeting()).toBe('format.goodAfternoon');
    jest.setSystemTime(new Date(2026, 6, 15, 20, 0, 0));
    expect(greeting()).toBe('format.goodEvening');
  });

  it('builds visitor log date ranges', () => {
    const today = visitorLogRangeBounds('today');
    expect(new Date(today.start).getHours()).toBe(0);
    expect(new Date(today.end).getHours()).toBe(23);

    const yesterday = visitorLogRangeBounds('yesterday');
    expect(new Date(yesterday.start).getDate()).toBe(14);

    const week = visitorLogRangeBounds('week');
    expect(new Date(week.end).getTime()).toBeGreaterThan(new Date(week.start).getTime());
  });
});
