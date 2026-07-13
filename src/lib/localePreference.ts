import AsyncStorage from '@react-native-async-storage/async-storage';

import { env } from '@/env';
import i18n from '@/i18n';

export const LOCALE_PREFERENCE_KEY = 'app:locale';

export type AppLocale = 'en' | 'hi';

const VALID_LOCALES = new Set<AppLocale>(['en', 'hi']);

export function isHindiEnabled(): boolean {
  return env.enableHindi;
}

export async function loadLocalePreference(): Promise<AppLocale> {
  if (!isHindiEnabled()) return 'en';

  const saved = await AsyncStorage.getItem(LOCALE_PREFERENCE_KEY);
  return saved && VALID_LOCALES.has(saved as AppLocale) ? (saved as AppLocale) : 'en';
}

export async function saveLocalePreference(locale: AppLocale): Promise<void> {
  await AsyncStorage.setItem(LOCALE_PREFERENCE_KEY, locale);
}

export function applyLocalePreference(locale: AppLocale): void {
  void i18n.changeLanguage(locale);
}

export async function setLocalePreference(locale: AppLocale): Promise<void> {
  if (!isHindiEnabled() && locale !== 'en') return;

  await saveLocalePreference(locale);
  applyLocalePreference(locale);
}
