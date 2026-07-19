import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useCSSVariable } from 'uniwind';

import { themedStackScreenOptions } from '@/lib/stackScreenOptions';

export default function MenuLayout() {
  const { t } = useTranslation();
  const text = useCSSVariable('--color-text-primary') as string;
  const bg = useCSSVariable('--color-bg') as string;
  const base = themedStackScreenOptions(bg, text);

  return (
    <Stack screenOptions={{ ...base, headerLargeTitle: true }}>
      <Stack.Screen name="index" options={{ title: t('nav.tabs.menu'), headerShown: false }} />
      <Stack.Screen name="profile" options={{ title: t('nav.screens.profile'), headerLargeTitle: false }} />
      <Stack.Screen name="complaints/index" options={{ title: t('nav.screens.helpdesk') }} />
      <Stack.Screen name="complaints/[id]" options={{ title: t('nav.screens.ticket'), headerLargeTitle: false }} />
      <Stack.Screen name="complaints/new" options={{ title: t('nav.screens.raiseTicket'), headerLargeTitle: false }} />
      <Stack.Screen name="amenities/index" options={{ title: t('nav.screens.bookAmenity') }} />
      <Stack.Screen name="amenities/[id]" options={{ title: t('nav.screens.bookAmenity'), headerLargeTitle: false, headerShown: false }} />
      <Stack.Screen name="payments" options={{ title: t('nav.screens.payments') }} />
      <Stack.Screen name="vehicles" options={{ title: t('nav.screens.vehicles') }} />
      <Stack.Screen name="family" options={{ title: t('nav.screens.family') }} />
      <Stack.Screen name="visitor-history" options={{ title: t('nav.screens.visitorHistory') }} />
      <Stack.Screen name="notifications" options={{ title: t('nav.screens.notifications') }} />
      <Stack.Screen name="settings" options={{ title: t('nav.screens.settings') }} />
    </Stack>
  );
}
