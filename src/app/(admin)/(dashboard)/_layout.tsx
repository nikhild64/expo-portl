import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useCSSVariable } from 'uniwind';

export default function AdminDashboardLayout() {
  const { t } = useTranslation();
  const bg = useCSSVariable('--color-bg') as string;
  const text = useCSSVariable('--color-text-primary') as string;

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: bg },
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="notifications"
        options={{
          title: t('nav.screens.notifications'),
          headerShown: true,
          headerLargeTitle: true,
          headerLargeStyle: { backgroundColor: bg },
          headerLargeTitleShadowVisible: false,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: bg },
          headerTintColor: text,
          headerTitleStyle: { color: text },
        }}
      />
      <Stack.Screen
        name="pending"
        options={{
          title: t('nav.screens.pendingApprovals'),
          headerShown: true,
          headerLargeTitle: true,
          headerLargeStyle: { backgroundColor: bg },
          headerLargeTitleShadowVisible: false,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: bg },
          headerTintColor: text,
          headerTitleStyle: { color: text },
        }}
      />
      <Stack.Screen
        name="gate"
        options={{
          title: t('nav.screens.liveGate'),
          headerShown: true,
          headerLargeTitle: true,
          headerLargeStyle: { backgroundColor: bg },
          headerLargeTitleShadowVisible: false,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: bg },
          headerTintColor: text,
          headerTitleStyle: { color: text },
        }}
      />
      <Stack.Screen
        name="complaints/[id]"
        options={{
          title: t('nav.screens.complaint'),
          headerShown: true,
          headerLargeTitle: false,
          headerLargeStyle: { backgroundColor: bg },
          headerLargeTitleShadowVisible: false,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: bg },
          headerTintColor: text,
          headerTitleStyle: { color: text },
        }}
      />
    </Stack>
  );
}
