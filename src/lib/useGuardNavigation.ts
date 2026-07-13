import { router, useSegments, type Href } from 'expo-router';

import { guardHref } from '@/lib/guardRoutes';

export function useGuardNavigation() {
  const segments = useSegments();

  return {
    segments,
    href: (...pathParts: string[]) => guardHref(segments, ...pathParts),
    push: (...pathParts: string[]) => router.push(guardHref(segments, ...pathParts)),
    replace: (...pathParts: string[]) => router.replace(guardHref(segments, ...pathParts)),
  };
}

export type GuardNavigation = {
  segments: readonly string[];
  href: (...pathParts: string[]) => Href;
  push: (...pathParts: string[]) => void;
  replace: (...pathParts: string[]) => void;
};
