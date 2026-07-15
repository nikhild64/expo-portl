import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useCSSVariable } from 'uniwind';

export default function GuardMenuLayout() {
  const { t } = useTranslation();
  const text = useCSSVariable('--color-text-primary') as string;
  const bg = useCSSVariable('--color-bg') as string;

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: bg },
        headerLargeStyle: { backgroundColor: bg },
        headerLargeTitleShadowVisible: false,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: bg },
        headerTintColor: text,
        headerTitleStyle: { color: text },
      }}
    >
      <Stack.Screen name="index" options={{ title: t('nav.tabs.menu'), headerLargeTitle: true }} />
      <Stack.Screen name="profile" options={{ title: t('nav.screens.profile'), headerLargeTitle: false }} />
      <Stack.Screen name="alerts" options={{ title: t('nav.screens.raiseAlert'), headerLargeTitle: false }} />
      <Stack.Screen name="shift-info" options={{ title: t('guard.alerts.shiftInfo'), headerLargeTitle: false }} />
      <Stack.Screen name="notifications" options={{ title: t('nav.screens.notifications'), headerLargeTitle: true }} />
      <Stack.Screen name="settings" options={{ title: t('nav.screens.settings'), headerLargeTitle: false }} />
    </Stack>
  );
}
