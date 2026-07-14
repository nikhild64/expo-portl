import { useSegments } from 'expo-router';
import { useEffect } from 'react';

import { setNavigationSegments } from '@/lib/navigationSegmentsStore';

/** Keeps navigation segments available for push notification tap handlers. */
export function NavigationSegmentsBridge() {
  const segments = useSegments();

  useEffect(() => {
    setNavigationSegments(segments);
  }, [segments]);

  return null;
}
