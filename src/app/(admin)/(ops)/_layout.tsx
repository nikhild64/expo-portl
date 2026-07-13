import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useCSSVariable } from 'uniwind';

export default function AdminOpsLayout() {
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
      <Stack.Screen name="index" options={{ title: t('nav.screens.helpdesk') }} />
      <Stack.Screen name="complaints/index" options={{ title: t('nav.screens.helpdesk') }} />
      <Stack.Screen name="complaints/[id]" options={{ title: t('nav.screens.complaint'), headerLargeTitle: false }} />
      <Stack.Screen name="dues/index" options={{ title: t('nav.screens.dues') }} />
      <Stack.Screen name="dues/defaulters" options={{ title: t('nav.screens.defaulters') }} />
      <Stack.Screen name="gate" options={{ title: t('nav.screens.liveGate') }} />
      <Stack.Screen name="visitor-history" options={{ title: t('nav.screens.visitorHistory') }} />
      <Stack.Screen name="notifications" options={{ title: t('nav.screens.notifications') }} />
      <Stack.Screen name="pending" options={{ title: t('nav.screens.pendingApprovals') }} />
    </Stack>
  );
}
