import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useCSSVariable } from 'uniwind';

export default function AdminCommunityLayout() {
  const { t } = useTranslation();
  const text = useCSSVariable('--color-text-primary') as string;
  const bg = useCSSVariable('--color-bg') as string;

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: bg },
        headerLargeTitle: true,
        headerLargeStyle: { backgroundColor: bg },
        headerLargeTitleShadowVisible: false,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: bg },
        headerTintColor: text,
        headerTitleStyle: { color: text },
      }}
    >
      <Stack.Screen name="index" options={{ title: t('nav.tabs.community') }} />
      <Stack.Screen name="notices/index" options={{ title: t('nav.screens.notices') }} />
      <Stack.Screen name="notices/new" options={{ title: t('nav.screens.newNotice'), headerLargeTitle: false }} />
      <Stack.Screen name="notices/[id]/edit" options={{ title: t('nav.screens.editNotice'), headerLargeTitle: false }} />
      <Stack.Screen name="polls/index" options={{ title: t('nav.screens.polls') }} />
      <Stack.Screen name="polls/new" options={{ title: t('nav.screens.newPoll'), headerLargeTitle: false }} />
      <Stack.Screen name="polls/[id]/edit" options={{ title: t('nav.screens.editPoll'), headerLargeTitle: false }} />
      <Stack.Screen name="amenities/index" options={{ title: t('nav.screens.amenities') }} />
      <Stack.Screen name="amenities/[id]" options={{ title: t('nav.screens.amenity'), headerLargeTitle: false }} />
      <Stack.Screen name="amenities/[id]/bookings" options={{ title: t('nav.screens.bookings'), headerLargeTitle: false }} />
    </Stack>
  );
}
