import type { Href } from 'expo-router';

export function createRoleRoutes<T extends string>(
  tabGroups: readonly T[],
  defaultGroup: T,
  groupRoots: Record<T, Href>,
) {
  function tabGroup(segments: readonly string[]): T {
    for (const group of tabGroups) {
      if (segments.includes(group)) return group;
    }
    return defaultGroup;
  }

  function href(segments: readonly string[], ...pathParts: string[]): Href {
    const group = tabGroup(segments);
    const path = pathParts.filter(Boolean).join('/');
    if (!path) return groupRoots[group];
    return `${groupRoots[group]}/${path}` as Href;
  }

  return { tabGroup, href, groupRoots };
}
