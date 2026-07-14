import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useCSSVariable } from 'uniwind';

import { sheetTransition, themedStackScreenOptions } from '@/lib/stackScreenOptions';

export default function ApprovalsLayout() {
  const { t } = useTranslation();
  const text = useCSSVariable('--color-text-primary') as string;
  const bg = useCSSVariable('--color-bg') as string;
  const base = themedStackScreenOptions(bg, text);

  return (
    <Stack screenOptions={{ ...base, headerLargeTitle: true }}>
      <Stack.Screen name="index" options={{ title: t('nav.tabs.approvals') }} />
      <Stack.Screen
        name="[id]"
        options={{
          ...base,
          ...sheetTransition,
          headerShown: false,
          title: t('nav.screens.visitorApproval'),
          headerLargeTitle: false,
        }}
      />
      <Stack.Screen name="preapprove" options={{ title: t('nav.screens.preapproveVisitor'), headerLargeTitle: false }} />
      <Stack.Screen
        name="preapprove/[id]/qr"
        options={{ title: t('nav.screens.preapprovalCreated'), headerLargeTitle: false, animation: 'fade_from_bottom', animationDuration: 320 }}
      />
    </Stack>
  );
}
