import { registerAuthUserIdGetter, resolveAuthUserId } from './authSession';

describe('authSession', () => {
  afterEach(() => {
    registerAuthUserIdGetter(() => undefined);
  });

  it('returns undefined before a getter is registered', () => {
    expect(resolveAuthUserId()).toBeUndefined();
  });

  it('uses the latest registered getter', () => {
    registerAuthUserIdGetter(() => 'user-1');
    expect(resolveAuthUserId()).toBe('user-1');

    registerAuthUserIdGetter(() => 'user-2');
    expect(resolveAuthUserId()).toBe('user-2');
  });
});
