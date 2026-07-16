import { useEffect } from 'react';

import { setSentryUser } from '@/lib/sentry';
import { useAuthStore } from '@/stores/authStore';

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
