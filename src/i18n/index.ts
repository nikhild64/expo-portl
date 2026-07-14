import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { env } from '@/env';

import en from './locales/en.json';
import hi from './locales/hi.json';

const resources: Record<string, { translation: typeof en }> = {
  en: { translation: en },
};

if (env.enableHindi) {
  resources.hi = { translation: hi };
}

// eslint-disable-next-line import/no-named-as-default-member -- i18next chain API
void i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  supportedLngs: env.enableHindi ? ['en', 'hi'] : ['en'],
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export default i18n;
