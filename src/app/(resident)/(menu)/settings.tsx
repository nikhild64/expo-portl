import { Alert, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { router, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { useUniwind } from 'uniwind';

import { Button, Card, Chip, ListRow, Screen, Text, ThemeSwitch } from '@/components';
import { setThemePreference, type ThemeChoice } from '@/lib/themePreference';
import { useAuthStore } from '@/stores/authStore';

const notificationKeys = ['Visitors', 'Notices', 'Payments', 'Complaints'] as const;
const defaultToggles = Object.fromEntries(notificationKeys.map((key) => [key, true])) as Record<
  (typeof notificationKeys)[number],
  boolean
>;

export default function SettingsScreen() {
  const signOut = useAuthStore((s) => s.signOut);
  const { theme, hasAdaptiveThemes } = useUniwind();
  const currentTheme = (hasAdaptiveThemes ? 'system' : theme) as ThemeChoice;
  const [toggles, setToggles] = useState(defaultToggles);

  useEffect(() => {
    const load = async () => {
      const pairs = await Promise.all(
        notificationKeys.map(async (key) => [key, (await AsyncStorage.getItem(`notifications:${key}`)) !== 'false'] as const),
      );
      setToggles(Object.fromEntries(pairs) as typeof defaultToggles);
    };
    load();
  }, []);

  const setNotification = async (key: (typeof notificationKeys)[number], value: boolean) => {
    await AsyncStorage.setItem(`notifications:${key}`, String(value));
    setToggles((current) => ({ ...current, [key]: value }));
  };

  const handleSignOut = () => {
    Alert.alert('Sign out?', 'You will return to sign-in.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/sign-in' as Href);
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
          {notificationKeys.map((key, index) => (
            <View key={key}>
              {index > 0 && <View className="h-px bg-border ml-base" />}
              <ListRow
                title={key}
                right={<ThemeSwitch value={toggles[key]} onValueChange={(value) => setNotification(key, value)} />}
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
