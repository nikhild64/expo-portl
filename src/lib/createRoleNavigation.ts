import { router, useSegments, type Href } from 'expo-router';

export function createRoleNavigation(hrefFn: (segments: readonly string[], ...pathParts: string[]) => Href) {
  return function useRoleNavigation() {
    const segments = useSegments();

    return {
      segments,
      href: (...pathParts: string[]) => hrefFn(segments, ...pathParts),
      push: (...pathParts: string[]) => router.push(hrefFn(segments, ...pathParts)),
      replace: (...pathParts: string[]) => router.replace(hrefFn(segments, ...pathParts)),
    };
  };
}

export type RoleNavigation = {
  segments: readonly string[];
  href: (...pathParts: string[]) => Href;
  push: (...pathParts: string[]) => void;
  replace: (...pathParts: string[]) => void;
};
