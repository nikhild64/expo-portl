import { Stack } from 'expo-router';
import { useCSSVariable } from 'uniwind';

export default function GuardMenuLayout() {
  const text = useCSSVariable('--color-text-primary') as string;
  const bg = useCSSVariable('--color-bg') as string;

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: bg },
        headerLargeStyle: { backgroundColor: bg },
        headerLargeTitleShadowVisible: false,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: bg },
        headerTintColor: text,
        headerTitleStyle: { color: text },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Menu', headerLargeTitle: true }} />
      <Stack.Screen name="profile" options={{ title: 'Profile', headerLargeTitle: false }} />
      <Stack.Screen name="alerts" options={{ title: 'Raise Alert', headerLargeTitle: false }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications', headerLargeTitle: true }} />
    </Stack>
  );
}
