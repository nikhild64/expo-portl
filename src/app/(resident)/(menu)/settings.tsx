import { Alert, Switch, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Uniwind, useUniwind } from 'uniwind';

import { Button, Card, Chip, ListRow, Screen, Text } from '@/components';
import { useAuthStore } from '@/stores/authStore';

const notificationKeys = ['Visitors', 'Notices', 'Payments', 'Complaints'] as const;
const defaultToggles = Object.fromEntries(notificationKeys.map((key) => [key, true])) as Record<
  (typeof notificationKeys)[number],
  boolean
>;

type ThemeChoice = 'system' | 'light' | 'dark';

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
          router.replace('/(auth)/sign-in' as never);
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
          {notificationKeys.map((key) => (
            <ListRow
              key={key}
              title={key}
              right={<Switch value={toggles[key]} onValueChange={(value) => setNotification(key, value)} />}
            />
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
              onPress={() => Uniwind.setTheme(choice)}
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
