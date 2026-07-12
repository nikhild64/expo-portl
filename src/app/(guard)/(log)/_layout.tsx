import { Stack } from 'expo-router';
import { useCSSVariable } from 'uniwind';

export default function GuardLogLayout() {
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
      <Stack.Screen name="index" options={{ title: 'Log' }} />
    </Stack>
  );
}
