import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Avatar, Card, Screen, StatusPill, Text } from '@/components';
import { formatDateTime, titleize } from '@/lib/format';
import { useAuthStore } from '@/stores/authStore';

export default function GuardProfileScreen() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <Card className="items-center gap-md">
        <Avatar name={profile?.full_name ?? 'Guard'} uri={profile?.avatar_url ?? undefined} size="xl" />
        <View className="items-center gap-xs">
          <Text variant="titleLarge" className="text-center">{profile?.full_name ?? 'Guard'}</Text>
          <StatusPill
            tone="success"
            label={profile?.status ? t(`status.${profile.status}`).toUpperCase() : t('status.active').toUpperCase()}
            align="center"
          />
        </View>
      </Card>

      <Card className="gap-md">
        <View>
          <Text variant="caption" color="textSecondary">
            ROLE
          </Text>
          <Text variant="headline">{titleize(profile?.role)}</Text>
        </View>
        <View>
          <Text variant="caption" color="textSecondary">
            {t('common.phone').toUpperCase()}
          </Text>
          <Text variant="headline" selectable>
            {profile?.phone ?? t('format.notSet')}
          </Text>
        </View>
        <View>
          <Text variant="caption" color="textSecondary">
            {t('nav.tabs.society').toUpperCase()}
          </Text>
          <Text variant="headline" selectable>
            {profile?.society_id ?? t('format.notSet')}
          </Text>
        </View>
        <View>
          <Text variant="caption" color="textSecondary">
            UPDATED
          </Text>
          <Text variant="headline">{formatDateTime(profile?.updated_at)}</Text>
        </View>
      </Card>
    </Screen>
  );
}
