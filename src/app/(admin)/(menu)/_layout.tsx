import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useCSSVariable } from 'uniwind';

import { themedStackScreenOptions } from '@/lib/stackScreenOptions';

export default function AdminMenuLayout() {
  const { t } = useTranslation();
  const text = useCSSVariable('--color-text-primary') as string;
  const bg = useCSSVariable('--color-bg') as string;
  const base = themedStackScreenOptions(bg, text);

  return (
    <Stack screenOptions={{ ...base, headerLargeTitle: true }}>
      <Stack.Screen name="index" options={{ title: t('nav.tabs.menu'), headerShown: false }} />
      <Stack.Screen name="profile" options={{ title: t('nav.screens.profile'), headerLargeTitle: false }} />
      <Stack.Screen name="society-settings" options={{ title: t('nav.screens.societySettings'), headerLargeTitle: false }} />
      <Stack.Screen name="settings" options={{ title: t('nav.screens.settings') }} />
      <Stack.Screen name="notifications" options={{ title: t('nav.screens.notifications') }} />
      <Stack.Screen name="pending" options={{ title: t('nav.screens.pendingApprovals') }} />
      <Stack.Screen name="gate" options={{ title: t('nav.screens.liveGate'), headerLargeTitle: false }} />
      <Stack.Screen name="complaints/[id]" options={{ title: t('nav.screens.complaint'), headerLargeTitle: false }} />
    </Stack>
  );
}
