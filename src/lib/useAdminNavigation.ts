import { router, useSegments, type Href } from 'expo-router';

import { adminHref } from '@/lib/adminRoutes';

export function useAdminNavigation() {
  const segments = useSegments();

  return {
    segments,
    href: (...pathParts: string[]) => adminHref(segments, ...pathParts),
    push: (...pathParts: string[]) => router.push(adminHref(segments, ...pathParts)),
    replace: (...pathParts: string[]) => router.replace(adminHref(segments, ...pathParts)),
  };
}

export type AdminNavigation = {
  segments: readonly string[];
  href: (...pathParts: string[]) => Href;
  push: (...pathParts: string[]) => void;
  replace: (...pathParts: string[]) => void;
};
