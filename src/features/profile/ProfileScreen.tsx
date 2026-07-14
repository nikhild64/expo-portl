import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { confirmSignOut } from '@/lib/alert';
import { Avatar, Button, Card, Screen, ScreenEmpty, StatusPill, Text } from '@/components';
import { ProfileEditForm } from '@/features/profile/ProfileEditForm';
import { formatDateTime, formatFlatLabel, titleize } from '@/lib/format';
import { useMyPrimaryFlat } from '@/queries/useMe';
import { useAuthStore } from '@/stores/authStore';

export type ProfileVariant = 'resident' | 'admin' | 'guard';

interface Props {
  variant?: ProfileVariant;
}

export default function ProfileScreen({ variant = 'resident' }: Props) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const profile = useAuthStore((s) => s.profile);
  const email = useAuthStore((s) => s.session?.user.email);
  const signOut = useAuthStore((s) => s.signOut);
  const { data: primaryFlat } = useMyPrimaryFlat();
  const editable = variant !== 'guard';

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

  const statusLabel =
    variant === 'guard'
      ? t(`status.${profile.status}`).toUpperCase()
      : titleize(profile.status);

  const handleSignOut = () => {
    confirmSignOut(t, signOut, {
      titleKey: 'alert.titles.signOut',
      messageKey: 'alert.messages.returnSignInScreen',
    });
  };

  return (
    <Screen scroll variant="tab">
      {editing ? (
        <ProfileEditForm profile={profile} onSaved={() => setEditing(false)} />
      ) : (
        <View className="gap-lg">
          <Card className="items-center gap-sm">
            <Avatar name={profile.full_name} uri={profile.avatar_url ?? undefined} size="xl" />
            <Text variant="title" className="text-center">{profile.full_name}</Text>
            <StatusPill
              tone="success"
              label={variant === 'guard' ? statusLabel : titleize(profile.role)}
              align="center"
            />
          </Card>

          <Card className="gap-md">
            <View>
              <Text variant="caption" color="textSecondary">
                {t('common.email').toUpperCase()}
              </Text>
              <Text variant="body" selectable>
                {email ?? t('format.notSet')}
              </Text>
            </View>

            {variant === 'resident' && (
              <>
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
              </>
            )}

            {variant === 'admin' && (
              <>
                <View>
                  <Text variant="caption" color="textSecondary">
                    {t('common.phone').toUpperCase()}
                  </Text>
                  <Text variant="body">{profile.phone ?? t('format.notSet')}</Text>
                </View>
                <View>
                  <Text variant="caption" color="textSecondary">
                    {t('common.status').toUpperCase()}
                  </Text>
                  <Text variant="body">{titleize(profile.status)}</Text>
                </View>
                <View>
                  <Text variant="caption" color="textSecondary">
                    {t('resident.profile.updated').toUpperCase()}
                  </Text>
                  <Text variant="body">{formatDateTime(profile.updated_at)}</Text>
                </View>
              </>
            )}

            {variant === 'guard' && (
              <>
                <View>
                  <Text variant="caption" color="textSecondary">
                    {t('admin.society.role').toUpperCase()}
                  </Text>
                  <Text variant="headline">{titleize(profile.role)}</Text>
                </View>
                <View>
                  <Text variant="caption" color="textSecondary">
                    {t('common.phone').toUpperCase()}
                  </Text>
                  <Text variant="headline" selectable>
                    {profile.phone ?? t('format.notSet')}
                  </Text>
                </View>
                <View>
                  <Text variant="caption" color="textSecondary">
                    {t('nav.tabs.society').toUpperCase()}
                  </Text>
                  <Text variant="headline" selectable>
                    {profile.society_id ?? t('format.notSet')}
                  </Text>
                </View>
                <View>
                  <Text variant="caption" color="textSecondary">
                    {t('resident.profile.updated').toUpperCase()}
                  </Text>
                  <Text variant="headline">{formatDateTime(profile.updated_at)}</Text>
                </View>
              </>
            )}
          </Card>

          {editable ? (
            <Button label={t('resident.profile.editProfile')} icon="edit" onPress={() => setEditing(true)} />
          ) : null}
          <Button label={t('common.signOut')} variant="outlined" onPress={handleSignOut} />
        </View>
      )}
    </Screen>
  );
}
