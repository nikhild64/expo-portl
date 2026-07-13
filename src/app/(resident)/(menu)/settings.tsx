import { Alert, View } from 'react-native';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useUniwind } from 'uniwind';

import { Button, Card, Chip, ListRow, Screen, Text, ThemeSwitch } from '@/components';
import { setThemePreference, type ThemeChoice } from '@/lib/themePreference';
import {
  type NotificationPreferenceKey,
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@/queries/useNotificationPreferences';
import { useAuthStore } from '@/stores/authStore';

const notificationKeys = [
  { label: 'Visitors', key: 'visitors' as const },
  { label: 'Notices', key: 'notices' as const },
  { label: 'Payments', key: 'payments' as const },
  { label: 'Complaints', key: 'complaints' as const },
];

export default function SettingsScreen() {
  const signOut = useAuthStore((s) => s.signOut);
  const { theme, hasAdaptiveThemes } = useUniwind();
  const currentTheme = (hasAdaptiveThemes ? 'system' : theme) as ThemeChoice;
  const { data: preferences } = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();

  const setNotification = async (key: NotificationPreferenceKey, value: boolean) => {
    try {
      await updatePreferences.mutateAsync({ [key]: value });
    } catch (error) {
      Alert.alert('Could not save preference', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign out?', 'You will return to sign-in.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/sign-in');
        },
      },
    ]);
  };

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <View className="gap-sm">
        <Text variant="caption" color="textSecondary">
          NOTIFICATIONS
        </Text>
        <Card padding="none" className="overflow-hidden">
          {notificationKeys.map((item, index) => (
            <View key={item.key}>
              {index > 0 && <View className="h-px bg-border ml-base" />}
              <ListRow
                title={item.label}
                right={
                  <ThemeSwitch
                    value={preferences?.[item.key] ?? true}
                    onValueChange={(value) => setNotification(item.key, value)}
                  />
                }
              />
            </View>
          ))}
        </Card>
      </View>

      <View className="gap-sm">
        <Text variant="caption" color="textSecondary">
          APPEARANCE
        </Text>
        <View className="flex-row gap-sm">
          {(['system', 'light', 'dark'] as ThemeChoice[]).map((choice) => (
            <Chip
              key={choice}
              label={choice}
              selected={currentTheme === choice}
              onPress={() => setThemePreference(choice)}
            />
          ))}
        </View>
      </View>

      <Card>
        <Text variant="caption" color="textSecondary">
          ABOUT
        </Text>
        <Text variant="body">Version {Constants.expoConfig?.version ?? '1.0.0'}</Text>
      </Card>

      <Button label="Sign out" variant="danger" onPress={handleSignOut} />
    </Screen>
  );
}
