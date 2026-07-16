import { createRoleRoutes } from './createRoleRoutes';

const { tabGroup, href } = createRoleRoutes(
  ['(home)', '(menu)'] as const,
  '(menu)',
  { '(home)': '/(role)/(home)', '(menu)': '/(role)/(menu)' },
);

describe('createRoleRoutes', () => {
  it('picks the active tab group from segments', () => {
    expect(tabGroup(['(role)', '(home)', 'index'])).toBe('(home)');
    expect(tabGroup(['(role)', '(menu)', 'profile'])).toBe('(menu)');
  });

  it('falls back to the default tab group', () => {
    expect(tabGroup(['(role)', 'index'])).toBe('(menu)');
  });

  it('returns group root when no path parts are provided', () => {
    expect(href(['(role)', '(home)'])).toBe('/(role)/(home)');
  });

  it('joins non-empty path parts under the active group', () => {
    expect(href(['(role)', '(menu)'], 'complaints', 'abc')).toBe('/(role)/(menu)/complaints/abc');
    expect(href(['(role)', '(menu)'], '', 'notifications')).toBe('/(role)/(menu)/notifications');
  });
});
