import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useCSSVariable } from 'uniwind';

import { themedStackScreenOptions } from '@/lib/stackScreenOptions';

export default function PaymentsLayout() {
  const { t } = useTranslation();
  const text = useCSSVariable('--color-text-primary') as string;
  const bg = useCSSVariable('--color-bg') as string;
  const base = themedStackScreenOptions(bg, text);

  return (
    <Stack screenOptions={{ ...base, headerLargeTitle: true }}>
      <Stack.Screen name="index" options={{ title: t('nav.tabs.payments'), headerShown: false }} />
    </Stack>
  );
}
