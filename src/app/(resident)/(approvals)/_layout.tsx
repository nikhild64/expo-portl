import { Stack } from 'expo-router';
import { useCSSVariable } from 'uniwind';

import { sheetTransition, themedStackScreenOptions } from '@/lib/stackScreenOptions';

export default function ApprovalsLayout() {
  const text = useCSSVariable('--color-text-primary') as string;
  const bg = useCSSVariable('--color-bg') as string;
  const base = themedStackScreenOptions(bg, text);

  return (
    <Stack screenOptions={{ ...base, headerLargeTitle: true }}>
      <Stack.Screen name="index" options={{ title: 'Approvals' }} />
      <Stack.Screen
        name="[id]"
        options={{
          ...base,
          ...sheetTransition,
          title: 'Visitor approval',
          headerLargeTitle: false,
        }}
      />
      <Stack.Screen name="preapprove" options={{ title: 'Pre-approve visitor', headerLargeTitle: false }} />
      <Stack.Screen
        name="preapprove/[id]/qr"
        options={{ title: 'Pre-approval created', headerLargeTitle: false, animation: 'fade_from_bottom', animationDuration: 320 }}
      />
    </Stack>
  );
}
