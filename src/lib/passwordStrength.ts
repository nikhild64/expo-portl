import i18n from '@/i18n';

export type PasswordStrengthLevel = 'weak' | 'fair' | 'strong';

export interface PasswordStrength {
  level: PasswordStrengthLevel;
  label: string;
  segments: number;
}

export function getPasswordStrength(password: string): PasswordStrength | null {
  if (!password) return null;

  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  if (score <= 1) return { level: 'weak', label: i18n.t('format.passwordWeak'), segments: 1 };
  if (score <= 2) return { level: 'fair', label: i18n.t('format.passwordFair'), segments: 2 };
  return { level: 'strong', label: i18n.t('format.passwordStrong'), segments: 4 };
}
