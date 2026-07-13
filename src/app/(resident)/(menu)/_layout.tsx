import { Stack } from 'expo-router';
import { useCSSVariable } from 'uniwind';

export default function MenuLayout() {
  const text = useCSSVariable('--color-text-primary') as string;
  const bg = useCSSVariable('--color-bg') as string;

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: bg },
        headerLargeTitle: true,
        headerLargeTitleShadowVisible: false,
        headerShadowVisible: false,
        headerTitleStyle: { color: text },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Menu' }} />
      <Stack.Screen name="profile" options={{ title: 'Profile', headerLargeTitle: false }} />
      <Stack.Screen name="complaints/index" options={{ title: 'Complaints' }} />
      <Stack.Screen name="complaints/[id]" options={{ title: 'Complaint', headerLargeTitle: false }} />
      <Stack.Screen name="complaints/new" options={{ title: 'New complaint', headerLargeTitle: false }} />
      <Stack.Screen name="amenities/index" options={{ title: 'Amenities' }} />
      <Stack.Screen name="amenities/[id]" options={{ title: 'Book amenity', headerLargeTitle: false }} />
      <Stack.Screen name="vehicles" options={{ title: 'Vehicles' }} />
      <Stack.Screen name="family" options={{ title: 'Family' }} />
      <Stack.Screen name="visitor-history" options={{ title: 'Visitor history' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
    </Stack>
  );
}
