import { useState } from 'react';
import { View } from 'react-native';

import { Avatar, Button, Card, Screen, ScreenEmpty, StatusPill, Text } from '@/components';
import { ProfileEditForm } from '@/features/profile/ProfileEditForm';
import { formatDateTime, titleize } from '@/lib/format';
import { useAuthStore } from '@/stores/authStore';

export default function AdminProfileScreen() {
  const [editing, setEditing] = useState(false);
  const profile = useAuthStore((s) => s.profile);

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
            <StatusPill tone="success" label={titleize(profile.role)} />
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
                STATUS
              </Text>
              <Text variant="body">{titleize(profile.status)}</Text>
            </View>
            <View>
              <Text variant="caption" color="textSecondary">
                UPDATED
              </Text>
              <Text variant="body">{formatDateTime(profile.updated_at)}</Text>
            </View>
          </Card>

          <Button label="Edit profile" icon="edit" onPress={() => setEditing(true)} />
        </View>
      )}
    </Screen>
  );
}
