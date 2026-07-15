import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useCSSVariable } from 'uniwind';

export default function GuardHomeLayout() {
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
        name="new"
        options={{
          title: t('nav.screens.newEntry'),
          headerShown: true,
          headerLargeTitle: false,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: bg },
          headerTintColor: text,
          headerTitleStyle: { color: text },
        }}
      />
      <Stack.Screen
        name="scan"
        options={{
          title: t('nav.screens.scanQr'),
          headerShown: true,
          headerLargeTitle: false,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: bg },
          headerTintColor: text,
          headerTitleStyle: { color: text },
        }}
      />
      <Stack.Screen
        name="waiting/[visitorId]"
        options={{
          title: t('nav.screens.approval'),
          headerShown: true,
          headerLargeTitle: false,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: bg },
          headerTintColor: text,
          headerTitleStyle: { color: text },
        }}
      />
      <Stack.Screen
        name="verify/[visitorId]"
        options={{
          title: t('nav.screens.verifyEntry'),
          headerShown: true,
          headerLargeTitle: false,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: bg },
          headerTintColor: text,
          headerTitleStyle: { color: text },
        }}
      />
      <Stack.Screen
        name="alerts"
        options={{
          title: t('nav.screens.raiseAlert'),
          headerShown: true,
          headerLargeTitle: false,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: bg },
          headerTintColor: text,
          headerTitleStyle: { color: text },
        }}
      />
    </Stack>
  );
}
