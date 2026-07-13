import { Stack } from 'expo-router';
import { useCSSVariable } from 'uniwind';

export default function GuardHomeLayout() {
  const bg = useCSSVariable('--color-bg') as string;
  const text = useCSSVariable('--color-text-primary') as string;

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: bg },
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          headerShown: true,
          headerLargeTitle: true,
          headerLargeStyle: { backgroundColor: bg },
          headerLargeTitleShadowVisible: false,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: bg },
          headerTintColor: text,
          headerTitleStyle: { color: text },
        }}
      />
      <Stack.Screen
        name="new"
        options={{
          title: 'New Entry',
          headerShown: true,
          headerLargeTitle: false,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: bg },
          headerTintColor: text,
          headerTitleStyle: { color: text },
        }}
      />
      <Stack.Screen
        name="scan"
        options={{
          title: 'Scan QR',
          headerShown: true,
          headerLargeTitle: false,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: bg },
          headerTintColor: text,
          headerTitleStyle: { color: text },
        }}
      />
      <Stack.Screen
        name="waiting/[visitorId]"
        options={{
          title: 'Approval',
          headerShown: true,
          headerLargeTitle: false,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: bg },
          headerTintColor: text,
          headerTitleStyle: { color: text },
        }}
      />
      <Stack.Screen
        name="verify/[visitorId]"
        options={{
          title: 'Verify Entry',
          headerShown: true,
          headerLargeTitle: false,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: bg },
          headerTintColor: text,
          headerTitleStyle: { color: text },
        }}
      />
    </Stack>
  );
}
