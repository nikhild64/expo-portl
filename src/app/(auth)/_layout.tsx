import { Stack } from 'expo-router';

import { ErrorBoundary } from '@/components';
import { stackTransition } from '@/lib/stackScreenOptions';

export default function AuthLayout() {
  return (
    <ErrorBoundary>
      <Stack screenOptions={{ headerShown: false, ...stackTransition }} />
    </ErrorBoundary>
  );
}
