import AsyncStorage from '@react-native-async-storage/async-storage';

import { env } from '@/env';
import i18n from '@/i18n';
import { supabase } from '@/lib/supabase';

export const LOCALE_PREFERENCE_KEY = 'app:locale';

export type AppLocale = 'en' | 'hi';

const VALID_LOCALES = new Set<AppLocale>(['en', 'hi']);

export function isHindiEnabled(): boolean {
  return env.enableHindi;
}

async function syncLocaleToProfile(locale: AppLocale): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return;

  try {
    const { error } = await supabase.rpc('update_preferred_locale', { p_locale: locale });
    if (error) console.warn('[locale] profile sync failed', error.message);
  } catch (error) {
    console.warn('[locale] profile sync failed', error);
  }
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
  void syncLocaleToProfile(locale);
}

/** Call after sign-in so push notifications use the device language. */
export async function syncLocalePreferenceToProfile(): Promise<void> {
  const locale = await loadLocalePreference();
  await syncLocaleToProfile(isHindiEnabled() ? locale : 'en');
}
