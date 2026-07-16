import { useEffect, useMemo, useRef } from 'react';
import { router } from 'expo-router';
import type { Session } from '@supabase/supabase-js';

import i18n from '@/i18n';
import { alertWarning } from '@/lib/alert';
import { useAuthStore } from '@/stores/authStore';
import type { Database } from '@/types/database';

type UserRole = Database['public']['Enums']['user_role'];
type Profile = Database['public']['Tables']['profiles']['Row'];

export type AuthBlockReason =
  | 'bootstrapping'
  | 'no_session'
  | 'wrong_role'
  | 'pending'
  | 'no_society'
  | null;

function authEntryHref() {
  const { session, hasSeenOnboarding } = useAuthStore.getState();
  if (!session) {
    return hasSeenOnboarding ? '/(auth)/sign-in' : '/(auth)/onboarding';
  }
  return '/';
}

export function resolveAuthBlockReason(input: {
  session: Session | null;
  profile: Profile | null;
  isBootstrapping: boolean;
  bootstrapError: string | null;
  requiredRole: UserRole;
}): AuthBlockReason {
  if (input.isBootstrapping) return 'bootstrapping';
  if (input.bootstrapError || !input.session || !input.profile) return 'no_session';
  if (!input.profile.society_id) return 'no_society';
  if (input.profile.status === 'pending') return 'pending';
  if (input.profile.role !== input.requiredRole) return 'wrong_role';
  if (input.profile.status !== 'active') return 'no_session';
  return null;
}

function redirectForBlockReason(reason: AuthBlockReason) {
  switch (reason) {
    case 'no_session':
      router.replace(authEntryHref());
      break;
    case 'no_society':
      router.replace('/(auth)/join-society');
      break;
    case 'pending':
      router.replace('/(auth)/pending-approval');
      break;
    case 'wrong_role':
      router.replace('/(auth)/sign-in');
      alertWarning(i18n.t('auth.wrongAccountType.title'), i18n.t('auth.wrongAccountType.message'));
      break;
    default:
      break;
  }
}

export function useAuthGuard(requiredRole: UserRole) {
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping);
  const authTransition = useAuthStore((s) => s.authTransition);
  const isSigningOut = authTransition === 'signOut';
  const bootstrapError = useAuthStore((s) => s.bootstrapError);
  const hasEvicted = useRef(false);

  const blockReason = useMemo(
    () => resolveAuthBlockReason({ session, profile, isBootstrapping, bootstrapError, requiredRole }),
    [session, profile, isBootstrapping, bootstrapError, requiredRole],
  );

  const isReady = blockReason === null;

  useEffect(() => {
    if (isSigningOut || blockReason === 'bootstrapping') return;

    if (isReady) {
      hasEvicted.current = false;
      return;
    }

    if (hasEvicted.current) return;
    hasEvicted.current = true;

    if (profile?.status === 'blocked') {
      router.replace('/');
      return;
    }

    redirectForBlockReason(blockReason);
  }, [blockReason, isReady, isSigningOut, profile?.status]);

  return { isReady, isBootstrapping, isSigningOut, blockReason };
}
