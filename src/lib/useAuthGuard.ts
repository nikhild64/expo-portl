import { useEffect, useRef } from 'react';
import { router } from 'expo-router';

import { useAuthStore } from '@/stores/authStore';
import type { Database } from '@/types/database';

type UserRole = Database['public']['Enums']['user_role'];

function authEntryHref() {
  const { session, hasSeenOnboarding } = useAuthStore.getState();
  if (!session) {
    return hasSeenOnboarding ? '/(auth)/sign-in' : '/(auth)/onboarding';
  }
  return '/';
}

export function useAuthGuard(requiredRole: UserRole) {
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping);
  const hasEvicted = useRef(false);

  const isReady =
    !isBootstrapping &&
    !!session &&
    !!profile &&
    profile.role === requiredRole &&
    profile.status === 'active';

  useEffect(() => {
    if (isBootstrapping) return;

    if (isReady) {
      hasEvicted.current = false;
      return;
    }

    if (hasEvicted.current) return;
    hasEvicted.current = true;
    router.replace(authEntryHref());
  }, [isBootstrapping, isReady]);

  return { isReady, isBootstrapping };
}
