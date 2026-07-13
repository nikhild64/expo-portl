import { Stack } from 'expo-router';
import { useCSSVariable } from 'uniwind';

export default function AdminCommunityLayout() {
  const text = useCSSVariable('--color-text-primary') as string;
  const bg = useCSSVariable('--color-bg') as string;

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: bg },
        headerLargeTitle: true,
        headerLargeStyle: { backgroundColor: bg },
        headerLargeTitleShadowVisible: false,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: bg },
        headerTintColor: text,
        headerTitleStyle: { color: text },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Community' }} />
      <Stack.Screen name="notices/index" options={{ title: 'Notices' }} />
      <Stack.Screen name="notices/new" options={{ title: 'New notice', headerLargeTitle: false }} />
      <Stack.Screen name="notices/[id]/edit" options={{ title: 'Edit notice', headerLargeTitle: false }} />
      <Stack.Screen name="polls/index" options={{ title: 'Polls' }} />
      <Stack.Screen name="polls/new" options={{ title: 'New poll', headerLargeTitle: false }} />
      <Stack.Screen name="polls/[id]/edit" options={{ title: 'Edit poll', headerLargeTitle: false }} />
      <Stack.Screen name="amenities/index" options={{ title: 'Amenities' }} />
      <Stack.Screen name="amenities/[id]" options={{ title: 'Amenity', headerLargeTitle: false }} />
      <Stack.Screen name="amenities/[id]/bookings" options={{ title: 'Bookings', headerLargeTitle: false }} />
    </Stack>
  );
}
