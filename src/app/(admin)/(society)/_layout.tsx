import { Stack } from 'expo-router';
import { useCSSVariable } from 'uniwind';

export default function AdminSocietyLayout() {
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
      <Stack.Screen name="index" options={{ title: 'Society' }} />
      <Stack.Screen name="residents/[id]" options={{ title: 'Resident', headerLargeTitle: false }} />
      <Stack.Screen name="pending" options={{ title: 'Pending approvals' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Stack.Screen name="complaints/[id]" options={{ title: 'Complaint', headerLargeTitle: false }} />
      <Stack.Screen name="towers" options={{ title: 'Towers' }} />
      <Stack.Screen name="towers/[id]" options={{ title: 'Tower', headerLargeTitle: false }} />
      <Stack.Screen name="towers/[id]/flats" options={{ title: 'Flats', headerLargeTitle: false }} />
      <Stack.Screen name="towers/[towerId]/flats/[flatId]" options={{ title: 'Flat', headerLargeTitle: false }} />
      <Stack.Screen name="staff/index" options={{ title: 'Staff' }} />
      <Stack.Screen name="staff/[id]" options={{ title: 'Staff member', headerLargeTitle: false }} />
      <Stack.Screen name="services/index" options={{ title: 'Services' }} />
      <Stack.Screen name="services/[id]" options={{ title: 'Service provider', headerLargeTitle: false }} />
    </Stack>
  );
}
