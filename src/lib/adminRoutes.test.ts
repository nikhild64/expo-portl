import {
  adminNotificationHref,
  adminTabGroup,
  adminHref,
} from './adminRoutes';

describe('adminRoutes', () => {
  it('detects the active admin tab group', () => {
    expect(adminTabGroup(['(admin)', '(ops)', 'complaints'])).toBe('(ops)');
    expect(adminTabGroup(['(admin)', 'index'])).toBe('(dashboard)');
  });

  it('rewrites complaint notification links into the active tab stack', () => {
    const segments = ['(admin)', '(menu)', 'index'];
    expect(adminNotificationHref('/(admin)/(ops)/complaints/c-1', segments)).toBe(
      '/(admin)/(menu)/complaints/c-1',
    );
  });

  it('rewrites pending society notifications', () => {
    const segments = ['(admin)', '(dashboard)'];
    expect(adminNotificationHref('/(admin)/(society)/pending', segments)).toBe(
      '/(admin)/(dashboard)/pending',
    );
  });

  it('returns null outside admin navigation', () => {
    expect(adminNotificationHref('/(admin)/(ops)/complaints/c-1', ['(resident)', '(home)'])).toBeNull();
  });

  it('builds hrefs under the active tab group', () => {
    expect(adminHref(['(admin)', '(society)'], 'residents')).toBe('/(admin)/(society)/residents');
  });
});
