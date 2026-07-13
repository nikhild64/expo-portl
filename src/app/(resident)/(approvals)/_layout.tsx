import { Stack } from 'expo-router';
import { useCSSVariable } from 'uniwind';

export default function ApprovalsLayout() {
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
      <Stack.Screen name="index" options={{ title: 'Approvals' }} />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Visitor approval',
          presentation: 'formSheet',
          sheetAllowedDetents: [0.5, 1],
          sheetGrabberVisible: true,
          headerLargeTitle: false,
        }}
      />
      <Stack.Screen name="preapprove" options={{ title: 'Pre-approve', headerLargeTitle: false }} />
      <Stack.Screen name="preapprove/[id]/qr" options={{ title: 'Visitor QR', headerLargeTitle: false }} />
    </Stack>
  );
}
