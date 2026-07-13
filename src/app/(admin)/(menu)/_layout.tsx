import { Stack } from 'expo-router';
import { useCSSVariable } from 'uniwind';

export default function AdminMenuLayout() {
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
      <Stack.Screen name="index" options={{ title: 'Menu' }} />
      <Stack.Screen name="profile" options={{ title: 'Profile', headerLargeTitle: false }} />
      <Stack.Screen name="society-settings" options={{ title: 'Society settings', headerLargeTitle: false }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Stack.Screen name="pending" options={{ title: 'Pending approvals' }} />
      <Stack.Screen name="complaints/[id]" options={{ title: 'Complaint', headerLargeTitle: false }} />
    </Stack>
  );
}
