import { Stack } from 'expo-router';
import { useCSSVariable } from 'uniwind';

export default function GuardHomeLayout() {
  const bg = useCSSVariable('--color-bg') as string;

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: bg },
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
