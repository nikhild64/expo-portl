import { router } from 'expo-router';

import {
  isAllowedNotificationRoute,
  pushNotificationRoute,
  resolveNotificationHref,
} from './notificationRoutes';
import { setNavigationSegments } from './navigationSegmentsStore';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

describe('notificationRoutes', () => {
  afterEach(() => {
    jest.clearAllMocks();
    setNavigationSegments([]);
  });

  it('allows only in-app route prefixes', () => {
    expect(isAllowedNotificationRoute('/(resident)/(home)')).toBe(true);
    expect(isAllowedNotificationRoute('/(guard)/(log)')).toBe(true);
    expect(isAllowedNotificationRoute('https://evil.test')).toBe(false);
  });

  it('resolves resident notification links using current segments', () => {
    setNavigationSegments(['(resident)', '(home)']);
    expect(resolveNotificationHref('/(resident)/(approvals)/v-1')).toEqual({
      pathname: '/(resident)/(home)/approvals/[id]',
      params: { id: 'v-1' },
    });
  });

  it('returns the raw url when allowed but no rewrite applies', () => {
    setNavigationSegments(['(auth)']);
    expect(resolveNotificationHref('/(auth)/sign-in')).toBe('/(auth)/sign-in');
  });

  it('returns null for disallowed urls', () => {
    expect(resolveNotificationHref('https://example.com')).toBeNull();
  });

  it('pushes only when a href resolves', () => {
    setNavigationSegments(['(resident)', '(home)']);
    pushNotificationRoute('/(resident)/(payments)');
    expect(router.push).toHaveBeenCalledWith('/(resident)/(home)/payments');

    pushNotificationRoute('https://blocked.test');
    expect(router.push).toHaveBeenCalledTimes(1);
  });
});
