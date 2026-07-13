import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useCSSVariable } from 'uniwind';

export default function AdminMenuLayout() {
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
      <Stack.Screen name="index" options={{ title: t('nav.tabs.menu') }} />
      <Stack.Screen name="profile" options={{ title: t('nav.screens.profile'), headerLargeTitle: false }} />
      <Stack.Screen name="society-settings" options={{ title: t('nav.screens.societySettings'), headerLargeTitle: false }} />
      <Stack.Screen name="notifications" options={{ title: t('nav.screens.notifications') }} />
      <Stack.Screen name="pending" options={{ title: t('nav.screens.pendingApprovals') }} />
      <Stack.Screen name="complaints/[id]" options={{ title: t('nav.screens.complaint'), headerLargeTitle: false }} />
    </Stack>
  );
}
