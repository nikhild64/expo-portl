import { Stack } from 'expo-router';
import { useCSSVariable } from 'uniwind';

import { sheetTransition, themedStackScreenOptions } from '@/lib/stackScreenOptions';

export default function HomeLayout() {
  const bg = useCSSVariable('--color-bg') as string;
  const text = useCSSVariable('--color-text-primary') as string;
  const base = themedStackScreenOptions(bg, text);

  return (
    <Stack screenOptions={{ ...base, headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="profile" options={{ ...base, title: 'Profile', headerShown: true, headerLargeTitle: false }} />
      <Stack.Screen name="amenities/index" options={{ ...base, title: 'Book amenity', headerShown: true, headerLargeTitle: true }} />
      <Stack.Screen
        name="amenities/[id]"
        options={{ ...base, title: 'Book amenity', headerShown: false, headerLargeTitle: false }}
      />
      <Stack.Screen name="complaints/new" options={{ ...base, title: 'New complaint', headerShown: true, headerLargeTitle: false }} />
      <Stack.Screen name="preapprove" options={{ ...base, title: 'Pre-approve visitor', headerShown: true, headerLargeTitle: false }} />
      <Stack.Screen
        name="preapprove/[id]/qr"
        options={{ ...base, title: 'Pre-approval created', headerShown: true, headerLargeTitle: false, animation: 'fade_from_bottom' }}
      />
      <Stack.Screen name="notifications" options={{ ...base, title: 'Notifications', headerShown: true, headerLargeTitle: true }} />
      <Stack.Screen name="notices/[id]" options={{ ...base, title: 'Notice', headerShown: true, headerLargeTitle: false }} />
      <Stack.Screen name="payments" options={{ ...base, title: 'Payments', headerShown: true, headerLargeTitle: true }} />
      <Stack.Screen
        name="approvals/[id]"
        options={{
          ...base,
          ...sheetTransition,
          title: 'Visitor approval',
          headerShown: true,
          headerLargeTitle: false,
        }}
      />
    </Stack>
  );
}
