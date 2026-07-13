import { Stack } from 'expo-router';
import { useCSSVariable } from 'uniwind';

export default function HomeLayout() {
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
        name="amenities"
        options={{
          title: 'Amenities',
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
        name="complaints/new"
        options={{
          title: 'New complaint',
          headerShown: true,
          headerLargeTitle: false,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: bg },
          headerTintColor: text,
          headerTitleStyle: { color: text },
        }}
      />
      <Stack.Screen
        name="preapprove"
        options={{
          title: 'Pre-approve',
          headerShown: true,
          headerLargeTitle: false,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: bg },
          headerTintColor: text,
          headerTitleStyle: { color: text },
        }}
      />
      <Stack.Screen
        name="preapprove/[id]/qr"
        options={{
          title: 'Visitor QR',
          headerShown: true,
          headerLargeTitle: false,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: bg },
          headerTintColor: text,
          headerTitleStyle: { color: text },
        }}
      />
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
        name="notices/[id]"
        options={{
          title: 'Notice',
          headerShown: true,
          headerLargeTitle: false,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: bg },
          headerTintColor: text,
          headerTitleStyle: { color: text },
        }}
      />
      <Stack.Screen
        name="payments"
        options={{
          title: 'Payments',
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
    </Stack>
  );
}
