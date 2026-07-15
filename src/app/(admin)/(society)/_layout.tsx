import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useCSSVariable } from 'uniwind';

import { themedStackScreenOptions } from '@/lib/stackScreenOptions';

export default function AdminSocietyLayout() {
  const { t } = useTranslation();
  const text = useCSSVariable('--color-text-primary') as string;
  const bg = useCSSVariable('--color-bg') as string;
  const base = themedStackScreenOptions(bg, text);

  return (
    <Stack screenOptions={{ ...base, headerLargeTitle: true }}>
      <Stack.Screen name="index" options={{ title: t('nav.tabs.society') }} />
      <Stack.Screen name="residents/[id]" options={{ title: t('nav.screens.resident'), headerLargeTitle: false }} />
      <Stack.Screen name="pending" options={{ title: t('nav.screens.pendingApprovals') }} />
      <Stack.Screen name="notifications" options={{ title: t('nav.screens.notifications') }} />
      <Stack.Screen name="complaints/[id]" options={{ title: t('nav.screens.complaint'), headerLargeTitle: false }} />
      <Stack.Screen name="towers" options={{ title: t('nav.screens.towers') }} />
      <Stack.Screen name="towers/[id]" options={{ title: t('nav.screens.tower'), headerLargeTitle: false }} />
      <Stack.Screen name="towers/[id]/flats" options={{ title: t('nav.screens.flats'), headerLargeTitle: false }} />
      <Stack.Screen name="towers/[towerId]/flats/[flatId]" options={{ title: t('nav.screens.flat'), headerLargeTitle: false }} />
      <Stack.Screen name="guards/index" options={{ title: t('nav.screens.guards') }} />
      <Stack.Screen name="guards/new" options={{ title: t('nav.screens.addGuard'), headerLargeTitle: false }} />
      <Stack.Screen name="guards/[id]" options={{ title: t('nav.screens.guard'), headerLargeTitle: false }} />
      <Stack.Screen name="staff/index" options={{ title: t('nav.screens.staff') }} />
      <Stack.Screen name="staff/[id]" options={{ title: t('nav.screens.staffMember'), headerLargeTitle: false }} />
      <Stack.Screen name="services/index" options={{ title: t('nav.screens.services') }} />
      <Stack.Screen name="services/[id]" options={{ title: t('nav.screens.serviceProvider'), headerLargeTitle: false }} />
    </Stack>
  );
}
