jest.mock('@/i18n', () => ({
  __esModule: true,
  default: { t: (key: string) => key },
}));

import { getPasswordStrength } from './passwordStrength';

describe('getPasswordStrength', () => {
  it('returns null for empty passwords', () => {
    expect(getPasswordStrength('')).toBeNull();
  });

  it('rates short simple passwords as weak', () => {
    expect(getPasswordStrength('abc')).toMatchObject({ level: 'weak', segments: 1 });
  });

  it('rates mixed passwords as fair', () => {
    expect(getPasswordStrength('Abcdefgh')).toMatchObject({ level: 'fair', segments: 2 });
  });

  it('rates complex passwords as strong', () => {
    expect(getPasswordStrength('Abcdef1!')).toMatchObject({ level: 'strong', segments: 4 });
  });
});
