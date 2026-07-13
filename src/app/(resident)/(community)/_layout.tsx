import { Stack } from 'expo-router';
import { useCSSVariable } from 'uniwind';

import { themedStackScreenOptions } from '@/lib/stackScreenOptions';

export default function CommunityLayout() {
  const text = useCSSVariable('--color-text-primary') as string;
  const bg = useCSSVariable('--color-bg') as string;
  const base = themedStackScreenOptions(bg, text);

  return (
    <Stack screenOptions={{ ...base, headerLargeTitle: true }}>
      <Stack.Screen name="index" options={{ title: 'Community' }} />
      <Stack.Screen name="notices/[id]" options={{ title: 'Notice', headerLargeTitle: false }} />
      <Stack.Screen name="polls/index" options={{ title: 'Community' }} />
      <Stack.Screen name="polls/[id]" options={{ title: 'Community poll', headerLargeTitle: false }} />
      <Stack.Screen name="directory/index" options={{ title: 'Community' }} />
    </Stack>
  );
}
