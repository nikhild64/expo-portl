import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useCSSVariable } from 'uniwind';

import { themedStackScreenOptions } from '@/lib/stackScreenOptions';

export default function GuardMenuLayout() {
  const { t } = useTranslation();
  const text = useCSSVariable('--color-text-primary') as string;
  const bg = useCSSVariable('--color-bg') as string;
  const base = themedStackScreenOptions(bg, text);

  return (
    <Stack screenOptions={base}>
      <Stack.Screen name="index" options={{ title: t('nav.tabs.menu'), headerLargeTitle: true, headerShown: false }} />
      <Stack.Screen name="profile" options={{ title: t('nav.screens.profile'), headerLargeTitle: false }} />
      <Stack.Screen name="alerts" options={{ title: t('nav.screens.raiseAlert'), headerLargeTitle: false }} />
      <Stack.Screen name="notifications" options={{ title: t('nav.screens.notifications'), headerLargeTitle: true }} />
      <Stack.Screen name="settings" options={{ title: t('nav.screens.settings'), headerLargeTitle: false }} />
    </Stack>
  );
}
