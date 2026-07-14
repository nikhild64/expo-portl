import type { Href } from 'expo-router';

import type { Database } from '@/types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];

export function routeForAuthenticatedUser(profile: Profile): Href {
  if (!profile.society_id) {
    return '/(auth)/join-society';
  }

  if (profile.status === 'pending') {
    return '/(auth)/pending-approval';
  }

  switch (profile.role) {
    case 'resident':
      return '/(resident)/(home)';
    case 'guard':
      return '/(guard)';
    case 'admin':
      return '/(admin)';
    default:
      return '/(auth)/sign-in';
  }
}
