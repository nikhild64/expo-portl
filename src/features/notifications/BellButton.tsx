import { Pressable, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { IconSymbol, Text } from '@/components';
import { useUnreadNotificationCount } from '@/queries/useNotifications';

interface Props {
  href: Href;
}

export function BellButton({ href }: Props) {
  const { t } = useTranslation();
  const { data: unread } = useUnreadNotificationCount();
  const count = unread ?? 0;

  return (
    <Pressable
      onPress={() => router.push(href)}
      accessibilityRole="button"
      accessibilityLabel={
        count > 0 ? t('common.unread', { count }) : t('a11y.notifications')
      }
      hitSlop={8}
    >
      <View className="w-10 h-10 rounded-pill items-center justify-center">
        <IconSymbol name="notifications" color={count > 0 ? 'coral' : 'textPrimary'} />
        {count > 0 && (
          <View
            className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-pill bg-error items-center justify-center"
            style={{ minWidth: 16 }}
          >
            <Text variant="caption" color="onPrimary">
              {count > 9 ? '9+' : String(count)}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}
