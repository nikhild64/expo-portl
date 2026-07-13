import { Stack } from 'expo-router';
import { useCSSVariable } from 'uniwind';

export default function AdminDashboardLayout() {
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
        name="pending"
        options={{
          title: 'Pending approvals',
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
        name="gate"
        options={{
          title: 'Live gate',
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
        name="complaints/[id]"
        options={{
          title: 'Complaint',
          headerShown: true,
          headerLargeTitle: false,
          headerLargeStyle: { backgroundColor: bg },
          headerLargeTitleShadowVisible: false,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: bg },
          headerTintColor: text,
          headerTitleStyle: { color: text },
        }}
      />
    </Stack>
  );
}
