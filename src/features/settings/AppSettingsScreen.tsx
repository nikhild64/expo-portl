import { View } from 'react-native';import { confirmSignOut, alertError } from '@/lib/alert';
import Constants from 'expo-constants';
import { useUniwind } from 'uniwind';

import { Button, Card, Chip, ListRow, Screen, Text, ThemeSwitch } from '@/components';
import { useLocale } from '@/hooks/useLocale';
import { setThemePreference, type ThemeChoice } from '@/lib/themePreference';
import {
  type NotificationPreferenceKey,
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@/queries/useNotificationPreferences';
import { useAuthStore } from '@/stores/authStore';

export type SettingsNotificationItem = {
  labelKey: 'settings.visitors' | 'settings.notices' | 'settings.payments' | 'settings.complaints';
  key: NotificationPreferenceKey;
};

interface Props {
  notificationKeys: readonly SettingsNotificationItem[];
}

export function AppSettingsScreen({ notificationKeys }: Props) {
  const signOut = useAuthStore((s) => s.signOut);
  const { theme, hasAdaptiveThemes } = useUniwind();
  const currentTheme = (hasAdaptiveThemes ? 'system' : theme) as ThemeChoice;
  const { data: preferences } = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();
  const { t, locale, setLocale, hindiEnabled } = useLocale();

  const setNotification = async (key: NotificationPreferenceKey, value: boolean) => {
    try {
      await updatePreferences.mutateAsync({ [key]: value });
    } catch (error) {
      alertError(t('settings.couldNotSavePreference'), error);
    }
  };

  const handleSignOut = () => {
    confirmSignOut(t, signOut);
  };

  return (
    <Screen scroll variant="tab">
      <View className="gap-sm">
        <Text variant="caption" color="textSecondary">
          {t('settings.notifications')}
        </Text>
        <Card padding="none" className="overflow-hidden">
          {notificationKeys.map((item, index) => (
            <View key={item.key}>
              {index > 0 && <View className="h-px bg-border ml-base" />}
              <ListRow
                title={t(item.labelKey)}
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

      {hindiEnabled && (
        <View className="gap-sm">
          <Text variant="caption" color="textSecondary">
            {t('settings.language')}
          </Text>
          <View className="flex-row gap-sm">
            {(['en', 'hi'] as const).map((choice) => (
              <Chip
                key={choice}
                label={choice === 'en' ? t('settings.english') : t('settings.hindi')}
                selected={locale === choice}
                onPress={() => setLocale(choice)}
              />
            ))}
          </View>
        </View>
      )}

      <View className="gap-sm">
        <Text variant="caption" color="textSecondary">
          {t('settings.appearance')}
        </Text>
        <View className="flex-row gap-sm">
          {(
            [
              { choice: 'system' as const, labelKey: 'settings.themeSystem' as const },
              { choice: 'light' as const, labelKey: 'settings.themeLight' as const },
              { choice: 'dark' as const, labelKey: 'settings.themeDark' as const },
            ] as const
          ).map(({ choice, labelKey }) => (
            <Chip
              key={choice}
              label={t(labelKey)}
              selected={currentTheme === choice}
              onPress={() => setThemePreference(choice)}
            />
          ))}
        </View>
      </View>

      <Card>
        <Text variant="caption" color="textSecondary">
          {t('settings.about')}
        </Text>
        <Text variant="body">
          {t('common.version', { version: Constants.expoConfig?.version ?? '1.0.0' })}
        </Text>
      </Card>

      <Button label={t('common.signOut')} variant="danger" onPress={handleSignOut} />
    </Screen>
  );
}
