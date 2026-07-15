import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useCSSVariable } from 'uniwind';

import { themedStackScreenOptions } from '@/lib/stackScreenOptions';

export default function GuardAddLayout() {
  const { t } = useTranslation();
  const text = useCSSVariable('--color-text-primary') as string;
  const bg = useCSSVariable('--color-bg') as string;
  const base = themedStackScreenOptions(bg, text);

  return (
    <Stack screenOptions={{ ...base, headerBackTitle: t('common.back') }}>
      <Stack.Screen name="index" options={{ title: t('nav.tabs.addVisitor'), headerLargeTitle: true }} />
      <Stack.Screen name="new" options={{ title: t('nav.screens.newEntry'), headerLargeTitle: false }} />
      <Stack.Screen name="scan" options={{ title: t('nav.screens.scanQr'), headerLargeTitle: false }} />
      <Stack.Screen name="waiting/[visitorId]" options={{ title: t('nav.screens.approval'), headerLargeTitle: false }} />
      <Stack.Screen name="verify/[visitorId]" options={{ title: t('nav.screens.verifyEntry'), headerLargeTitle: false }} />
      <Stack.Screen name="notifications" options={{ title: t('nav.screens.notifications'), headerLargeTitle: true }} />
    </Stack>
  );
}
