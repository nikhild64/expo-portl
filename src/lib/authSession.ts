type AuthUserIdGetter = () => string | undefined;

let getAuthUserId: AuthUserIdGetter = () => undefined;

export function registerAuthUserIdGetter(getter: AuthUserIdGetter) {
  getAuthUserId = getter;
}

export function resolveAuthUserId(): string | undefined {
  return getAuthUserId();
}
