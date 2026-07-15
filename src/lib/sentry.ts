import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';
import { useEffect } from 'react';

import { useAuthStore } from '@/stores/authStore';

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

export const sentryEnabled = Boolean(dsn);

function releaseName() {
  const slug = Constants.expoConfig?.slug ?? 'expo-portl';
  const version = Constants.expoConfig?.version ?? '0.0.0';
  const build = Constants.nativeBuildVersion;
  return build ? `${slug}@${version}+${build}` : `${slug}@${version}`;
}

export function initSentry() {
  if (!dsn) {
    if (!__DEV__) {
      console.warn('[sentry] EXPO_PUBLIC_SENTRY_DSN is not set; crash reporting disabled');
    }
    return;
  }

  Sentry.init({
    dsn,
    release: releaseName(),
    dist: Constants.nativeBuildVersion ?? Constants.expoConfig?.version,
    environment: __DEV__ ? 'development' : 'production',
    enabled: true,
    tracesSampleRate: __DEV__ ? 1 : 0.2,
    sendDefaultPii: false,
  });
}

export function setSentryUser(
  profile: { id: string; role: string; society_id: string | null } | null,
) {
  if (!sentryEnabled) return;

  if (!profile) {
    Sentry.setUser(null);
    return;
  }

  Sentry.setUser({ id: profile.id });
  Sentry.setTag('role', profile.role);
  if (profile.society_id) {
    Sentry.setTag('society_id', profile.society_id);
  }
}

export function captureException(error: unknown, context?: Record<string, unknown>) {
  if (!sentryEnabled) return;

  Sentry.withScope((scope) => {
    if (context) {
      for (const [key, value] of Object.entries(context)) {
        scope.setExtra(key, value);
      }
    }
    Sentry.captureException(error);
  });
}

/** Syncs signed-in profile context to Sentry error reports. */
export function SentryAuthScope() {
  const profile = useAuthStore((s) => s.profile);

  useEffect(() => {
    setSentryUser(
      profile
        ? { id: profile.id, role: profile.role, society_id: profile.society_id }
        : null,
    );
  }, [profile]);

  return null;
}

initSentry();

export { Sentry };
