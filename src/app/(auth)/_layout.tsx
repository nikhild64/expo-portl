import { Stack } from 'expo-router';

import { ErrorBoundary } from '@/components';

export default function AuthLayout() {
  return (
    <ErrorBoundary>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
    </ErrorBoundary>
  );
}
