import { Stack } from 'expo-router';
import { useCSSVariable } from 'uniwind';

export default function GuardAddLayout() {
  const text = useCSSVariable('--color-text-primary') as string;
  const bg = useCSSVariable('--color-bg') as string;

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: bg },
        headerBackTitle: 'Back',
        headerLargeStyle: { backgroundColor: bg },
        headerLargeTitleShadowVisible: false,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: bg },
        headerTintColor: text,
        headerTitleStyle: { color: text },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Add Visitor', headerLargeTitle: true }} />
      <Stack.Screen name="new" options={{ title: 'New Entry', headerLargeTitle: false }} />
      <Stack.Screen name="scan" options={{ title: 'Scan QR', headerLargeTitle: false }} />
      <Stack.Screen name="waiting/[visitorId]" options={{ title: 'Approval', headerLargeTitle: false }} />
      <Stack.Screen name="verify/[visitorId]" options={{ title: 'Verify Entry', headerLargeTitle: false }} />
    </Stack>
  );
}
