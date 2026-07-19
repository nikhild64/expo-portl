import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useCSSVariable } from 'uniwind';

import { themedStackScreenOptions } from '@/lib/stackScreenOptions';

export default function CommunityLayout() {
  const { t } = useTranslation();
  const text = useCSSVariable('--color-text-primary') as string;
  const bg = useCSSVariable('--color-bg') as string;
  const base = themedStackScreenOptions(bg, text);

  return (
    <Stack screenOptions={{ ...base, headerLargeTitle: true }}>
      <Stack.Screen name="index" options={{ title: t('nav.tabs.community'), headerShown: false }} />
      <Stack.Screen name="notices/[id]" options={{ title: t('nav.screens.notice'), headerLargeTitle: false }} />
      <Stack.Screen name="polls/index" options={{ title: t('nav.tabs.community') }} />
      <Stack.Screen name="polls/[id]" options={{ title: t('nav.screens.communityPoll'), headerLargeTitle: false }} />
      <Stack.Screen name="directory/index" options={{ title: t('nav.tabs.community') }} />
    </Stack>
  );
}
