import { router, useSegments, type Href } from 'expo-router';

import { residentHref } from '@/lib/residentRoutes';

/** Navigate within the active resident tab stack. */
export function useResidentNavigation() {
  const segments = useSegments();

  return {
    segments,
    href: (...pathParts: string[]) => residentHref(segments, ...pathParts),
    push: (...pathParts: string[]) => router.push(residentHref(segments, ...pathParts)),
    replace: (...pathParts: string[]) => router.replace(residentHref(segments, ...pathParts)),
  };
}

export type ResidentNavigation = {
  segments: readonly string[];
  href: (...pathParts: string[]) => Href;
  push: (...pathParts: string[]) => void;
  replace: (...pathParts: string[]) => void;
};
