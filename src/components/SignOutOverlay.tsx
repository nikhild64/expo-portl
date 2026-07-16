import { View } from 'react-native';

import { useAuthStore } from '@/stores/authStore';

/** Covers the app during sign-out so protected layouts and cache clears do not flash. */
export function SignOutOverlay() {
  const isSigningOut = useAuthStore((s) => s.isSigningOut);
  if (!isSigningOut) return null;

  return <View className="absolute inset-0 z-[999] bg-bg" pointerEvents="auto" />;
}
