import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import type { Database } from '@/types/database';

type UserRole = Database['public']['Enums']['user_role'];

export function useAuthGuard(requiredRole: UserRole) {
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping);

  useEffect(() => {
    if (isBootstrapping) return;

    if (!session || !profile) {
      router.replace('/');
      return;
    }

    if (profile.status !== 'active') {
      router.replace('/');
      return;
    }

    if (profile.role !== requiredRole) {
      router.replace('/');
    }
  }, [isBootstrapping, session, profile, requiredRole]);

  return {
    isReady: !isBootstrapping && !!session && !!profile && profile.role === requiredRole && profile.status === 'active',
  };
}
