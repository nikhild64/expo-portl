import { Stack } from 'expo-router';
import { useCSSVariable } from 'uniwind';

export default function CommunityLayout() {
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
      <Stack.Screen name="index" options={{ title: 'Community' }} />
      <Stack.Screen name="notices/[id]" options={{ title: 'Notice', headerLargeTitle: false }} />
      <Stack.Screen name="polls/index" options={{ title: 'Polls' }} />
      <Stack.Screen name="polls/[id]" options={{ title: 'Poll', headerLargeTitle: false }} />
      <Stack.Screen name="directory/index" options={{ title: 'Directory' }} />
    </Stack>
  );
}
