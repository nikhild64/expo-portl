import { Stack } from 'expo-router';
import { useCSSVariable } from 'uniwind';

export default function AdminOpsLayout() {
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
      <Stack.Screen name="index" options={{ title: 'Ops' }} />
      <Stack.Screen name="complaints/index" options={{ title: 'Complaints' }} />
      <Stack.Screen name="complaints/[id]" options={{ title: 'Complaint', headerLargeTitle: false }} />
      <Stack.Screen name="dues/index" options={{ title: 'Dues' }} />
      <Stack.Screen name="dues/defaulters" options={{ title: 'Defaulters' }} />
      <Stack.Screen name="gate" options={{ title: 'Live gate' }} />
      <Stack.Screen name="visitor-history" options={{ title: 'Visitor history' }} />
    </Stack>
  );
}
