/** Latest route segments for notification deep links outside React hooks. */
let latestSegments: readonly string[] = [];

export function setNavigationSegments(segments: readonly string[]): void {
  latestSegments = segments;
}

export function getNavigationSegments(): readonly string[] {
  return latestSegments;
}
