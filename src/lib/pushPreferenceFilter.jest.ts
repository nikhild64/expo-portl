import {
  filterProfileIdsByPreferences,
  preferenceColumnForChannel,
} from './pushPreferenceFilter';

describe('push preference column mapping', () => {
  it('maps polls channel to polls column, not notices', () => {
    expect(preferenceColumnForChannel('polls')).toBe('polls');
    expect(preferenceColumnForChannel('notices')).toBe('notices');
  });

  it('maps visitor-approval to visitors column', () => {
    expect(preferenceColumnForChannel('visitor-approval')).toBe('visitors');
  });

  it('excludes profiles with polls disabled for polls channel only', () => {
    const targets = ['resident-1', 'resident-2', 'resident-3'];
    const preferences = [
      { profile_id: 'resident-1', polls: true, notices: true },
      { profile_id: 'resident-2', polls: false, notices: true },
      { profile_id: 'resident-3', polls: false, notices: false },
    ];

    expect(filterProfileIdsByPreferences(targets, 'polls', preferences)).toEqual(['resident-1']);
    expect(filterProfileIdsByPreferences(targets, 'notices', preferences)).toEqual([
      'resident-1',
      'resident-2',
    ]);
  });

  it('keeps profiles without preference rows', () => {
    expect(filterProfileIdsByPreferences(['new-user'], 'polls', [])).toEqual(['new-user']);
  });

  it('passes through all targets for unknown channels', () => {
    const preferences = [{ profile_id: 'resident-1', polls: false }];
    expect(filterProfileIdsByPreferences(['resident-1'], 'maintenance', preferences)).toEqual([
      'resident-1',
    ]);
  });
});
