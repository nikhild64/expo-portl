jest.mock('@/i18n', () => ({
  __esModule: true,
  default: { t: (key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key },
}));

import { createStatusDisplay } from './statusDisplay';

describe('createStatusDisplay', () => {
  const display = createStatusDisplay(
    {
      open: { label: () => 'Open', tone: 'warning', icon: 'schedule' },
      closed: { label: () => 'Closed', tone: 'success' },
    },
    { i18nPrefix: 'status' },
  );

  it('returns configured labels, tones, and icons', () => {
    expect(display.label('open')).toBe('Open');
    expect(display.tone('open')).toBe('warning');
    expect(display.icon('open')).toBe('schedule');
    expect(display.display('closed')).toEqual({ label: 'Closed', tone: 'success', icon: undefined });
  });

  it('uppercases labels when requested', () => {
    expect(display.label('open', { uppercase: true })).toBe('OPEN');
  });

  it('falls back to titleized labels for unknown statuses', () => {
    expect(display.label('unknown' as never)).toBe('Unknown');
    expect(display.tone('unknown' as never)).toBe('info');
  });
});
