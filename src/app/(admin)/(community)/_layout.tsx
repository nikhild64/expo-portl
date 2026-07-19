import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useCSSVariable } from 'uniwind';

import { themedStackScreenOptions } from '@/lib/stackScreenOptions';

export default function AdminCommunityLayout() {
  const { t } = useTranslation();
  const text = useCSSVariable('--color-text-primary') as string;
  const bg = useCSSVariable('--color-bg') as string;
  const base = themedStackScreenOptions(bg, text);

  return (
    <Stack screenOptions={{ ...base, headerLargeTitle: true }}>
      <Stack.Screen name="index" options={{ title: t('nav.tabs.community'), headerShown: false }} />
      <Stack.Screen name="notices/index" options={{ title: t('nav.screens.notices') }} />
      <Stack.Screen name="notices/new" options={{ title: t('nav.screens.newNotice'), headerLargeTitle: false }} />
      <Stack.Screen name="notices/[id]/edit" options={{ title: t('nav.screens.editNotice'), headerLargeTitle: false }} />
      <Stack.Screen name="polls/index" options={{ title: t('nav.screens.polls') }} />
      <Stack.Screen name="polls/new" options={{ title: t('nav.screens.newPoll'), headerLargeTitle: false }} />
      <Stack.Screen name="polls/[id]/index" options={{ title: t('admin.community.pollResults'), headerLargeTitle: false }} />
      <Stack.Screen name="polls/[id]/edit" options={{ title: t('nav.screens.editPoll'), headerLargeTitle: false }} />
      <Stack.Screen name="amenities/index" options={{ title: t('nav.screens.amenities') }} />
      <Stack.Screen name="amenities/new" options={{ title: t('nav.screens.newAmenity'), headerLargeTitle: false }} />
      <Stack.Screen name="amenities/[id]" options={{ title: t('nav.screens.amenity'), headerLargeTitle: false }} />
      <Stack.Screen name="amenities/[id]/bookings" options={{ title: t('nav.screens.bookings'), headerLargeTitle: false }} />
    </Stack>
  );
}
