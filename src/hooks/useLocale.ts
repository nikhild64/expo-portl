import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { isHindiEnabled, setLocalePreference, type AppLocale } from '@/lib/localePreference';

export function useLocale() {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language?.startsWith('hi') ? 'hi' : 'en') as AppLocale;
  const hindiEnabled = isHindiEnabled();

  const setLocale = useCallback(async (next: AppLocale) => {
    await setLocalePreference(next);
  }, []);

  return { locale, setLocale, t, hindiEnabled };
}
