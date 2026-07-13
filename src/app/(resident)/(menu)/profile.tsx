import { useState } from 'react';
import { View } from 'react-native';

import { Avatar, Button, Card, Screen, ScreenEmpty, StatusPill, Text } from '@/components';
import { ProfileEditForm } from '@/features/profile/ProfileEditForm';
import { formatFlatLabel } from '@/lib/format';
import { useMyPrimaryFlat } from '@/queries/useMe';
import { useAuthStore } from '@/stores/authStore';

export default function ProfileScreen() {
  const [editing, setEditing] = useState(false);
  const profile = useAuthStore((s) => s.profile);
  const { data: primaryFlat } = useMyPrimaryFlat();

  if (!profile) {
    return <ScreenEmpty safe={false} icon="person" title="Profile unavailable" subtitle="Sign in again to refresh your profile." />;
  }

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      {editing ? (
        <ProfileEditForm profile={profile} onSaved={() => setEditing(false)} />
      ) : (
        <View className="gap-lg">
          <Card className="items-center gap-sm">
            <Avatar name={profile.full_name} uri={profile.avatar_url ?? undefined} size="xl" />
            <Text variant="title">{profile.full_name}</Text>
            <StatusPill tone="success" label={profile.role} />
          </Card>

          <Card className="gap-md">
            <View>
              <Text variant="caption" color="textSecondary">
                PHONE
              </Text>
              <Text variant="body">{profile.phone ?? 'Not set'}</Text>
            </View>
            <View>
              <Text variant="caption" color="textSecondary">
                FLAT
              </Text>
              <Text variant="body">
                {formatFlatLabel(primaryFlat?.flats?.towers?.name, primaryFlat?.flats?.number)}
              </Text>
            </View>
            <View>
              <Text variant="caption" color="textSecondary">
                MEMBERSHIP
              </Text>
              <Text variant="body">{primaryFlat?.is_head ? 'Head of family' : 'Resident'}</Text>
            </View>
          </Card>

          <Button label="Edit profile" icon="edit" onPress={() => setEditing(true)} />
        </View>
      )}
    </Screen>
  );
}
