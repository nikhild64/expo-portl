import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useCSSVariable } from 'uniwind';

import { sheetTransition, themedStackScreenOptions } from '@/lib/stackScreenOptions';

export default function HomeLayout() {
  const { t } = useTranslation();
  const bg = useCSSVariable('--color-bg') as string;
  const text = useCSSVariable('--color-text-primary') as string;
  const base = themedStackScreenOptions(bg, text);

  return (
    <Stack screenOptions={{ ...base, headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="profile" options={{ ...base, title: t('nav.screens.profile'), headerShown: true, headerLargeTitle: false }} />
      <Stack.Screen name="amenities/index" options={{ ...base, title: t('nav.screens.bookAmenity'), headerShown: true, headerLargeTitle: true }} />
      <Stack.Screen
        name="amenities/[id]"
        options={{ ...base, title: t('nav.screens.bookAmenity'), headerShown: false, headerLargeTitle: false }}
      />
      <Stack.Screen name="complaints/new" options={{ ...base, title: t('nav.screens.newComplaint'), headerShown: true, headerLargeTitle: false }} />
      <Stack.Screen name="complaints/[id]" options={{ ...base, title: t('nav.screens.ticket'), headerShown: true, headerLargeTitle: false }} />
      <Stack.Screen name="preapprove" options={{ ...base, title: t('nav.screens.preapproveVisitor'), headerShown: true, headerLargeTitle: false }} />
      <Stack.Screen
        name="preapprove/[id]/qr"
        options={{ ...base, title: t('nav.screens.preapprovalCreated'), headerShown: true, headerLargeTitle: false }}
      />
      <Stack.Screen name="notifications" options={{ ...base, title: t('nav.screens.notifications'), headerShown: true, headerLargeTitle: true }} />
      <Stack.Screen name="notices/[id]" options={{ ...base, title: t('nav.screens.notice'), headerShown: true, headerLargeTitle: false }} />
      <Stack.Screen name="payments" options={{ ...base, title: t('nav.tabs.payments'), headerShown: true, headerLargeTitle: true }} />
      <Stack.Screen
        name="approvals/[id]"
        options={{
          ...base,
          ...sheetTransition,
          headerShown: false,
          title: t('nav.screens.visitorApproval'),
          headerLargeTitle: false,
        }}
      />
    </Stack>
  );
}
