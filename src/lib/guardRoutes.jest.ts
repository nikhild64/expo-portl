import {
  guardHref,
  guardNotificationHref,
  guardTabGroup,
  guardVerifyHref,
} from './guardRoutes';

describe('guardRoutes', () => {
  it('detects the active guard tab group', () => {
    expect(guardTabGroup(['(guard)', '(log)'])).toBe('(log)');
    expect(guardTabGroup(['(guard)', 'index'])).toBe('(home)');
  });

  it('rewrites log and notification routes', () => {
    const segments = ['(guard)', '(menu)'];
    expect(guardNotificationHref('/(guard)/(log)', segments)).toBe('/(guard)/(log)');
    expect(guardNotificationHref('/(guard)/(home)/notifications', segments)).toBe(
      '/(guard)/(menu)/notifications',
    );
  });

  it('rewrites waiting visitor notifications to the home stack', () => {
    expect(guardNotificationHref('/(guard)/(home)/waiting/v-1', ['(guard)', '(home)'])).toBe(
      '/(guard)/(home)/waiting/v-1',
    );
    expect(guardNotificationHref('/(guard)/(add)/waiting/v-2', ['(guard)', '(home)'])).toBe(
      '/(guard)/(home)/waiting/v-2',
    );
  });

  it('returns null outside guard navigation', () => {
    expect(guardNotificationHref('/(guard)/(log)', ['(resident)', '(home)'])).toBeNull();
  });

  it('builds verify hrefs with visitor params', () => {
    expect(guardVerifyHref(['(guard)', '(home)'], 'visitor-1')).toEqual({
      pathname: '/(guard)/(home)/verify/[visitorId]',
      params: { visitorId: 'visitor-1' },
    });
  });

  it('builds hrefs under the active tab group', () => {
    expect(guardHref(['(guard)', '(menu)'], 'notifications')).toBe('/(guard)/(menu)/notifications');
  });
});
