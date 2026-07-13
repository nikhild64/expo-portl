import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Avatar, Button, Card, Screen, ScreenEmpty, StatusPill, Text } from '@/components';
import { ProfileEditForm } from '@/features/profile/ProfileEditForm';
import { formatFlatLabel, titleize } from '@/lib/format';
import { useMyPrimaryFlat } from '@/queries/useMe';
import { useAuthStore } from '@/stores/authStore';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const profile = useAuthStore((s) => s.profile);
  const { data: primaryFlat } = useMyPrimaryFlat();

  if (!profile) {
    return (
      <ScreenEmpty
        safe={false}
        icon="person"
        title={t('resident.profile.unavailable')}
        subtitle={t('resident.profile.signInAgain')}
      />
    );
  }

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      {editing ? (
        <ProfileEditForm profile={profile} onSaved={() => setEditing(false)} />
      ) : (
        <View className="gap-lg">
          <Card className="items-center gap-sm">
            <Avatar name={profile.full_name} uri={profile.avatar_url ?? undefined} size="xl" />
            <Text variant="title" className="text-center">{profile.full_name}</Text>
            <StatusPill tone="success" label={titleize(profile.role)} align="center" />
          </Card>

          <Card className="gap-md">
            <View>
              <Text variant="caption" color="textSecondary">
                {t('common.phone').toUpperCase()}
              </Text>
              <Text variant="body">{profile.phone ?? t('format.notSet')}</Text>
            </View>
            <View>
              <Text variant="caption" color="textSecondary">
                {t('resident.profile.flat')}
              </Text>
              <Text variant="body">
                {formatFlatLabel(primaryFlat?.flats?.towers?.name, primaryFlat?.flats?.number)}
              </Text>
            </View>
            <View>
              <Text variant="caption" color="textSecondary">
                {t('resident.profile.membership')}
              </Text>
              <Text variant="body">
                {primaryFlat?.is_head ? t('auth.joinSociety.headOfFamily') : t('nav.screens.resident')}
              </Text>
            </View>
          </Card>

          <Button label={t('resident.profile.editProfile')} icon="edit" onPress={() => setEditing(true)} />
        </View>
      )}
    </Screen>
  );
}
