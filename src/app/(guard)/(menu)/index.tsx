import { Alert, View } from 'react-native';
import { router, type Href } from 'expo-router';

import { Avatar, Card, IconSymbol, ListRow, Screen, Text } from '@/components';
import { useAuthStore } from '@/stores/authStore';

export default function GuardMenuScreen() {
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/sign-in');
  };

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <Card className="flex-row items-center gap-md">
        <Avatar name={profile?.full_name ?? 'Guard'} uri={profile?.avatar_url ?? undefined} size="lg" />
        <View className="flex-1">
          <Text variant="title">{profile?.full_name ?? 'Guard'}</Text>
          <Text variant="footnote" color="textSecondary">
            Security guard · Active shift
          </Text>
        </View>
      </Card>

      <Card padding="none" className="overflow-hidden">
        <ListRow
          title="Notifications"
          subtitle="Visitor requests and alerts"
          left={<IconSymbol name="notifications" color="coral" />}
          onPress={() => router.push('/(guard)/(menu)/notifications' as Href)}
        />
        <ListRow
          title="Profile"
          subtitle="View guard details"
          left={<IconSymbol name="person" color="coral" />}
          onPress={() => router.push('/(guard)/(menu)/profile' as Href)}
        />
        <ListRow
          title="Shift info"
          subtitle="6:00 AM to 2:00 PM"
          left={<IconSymbol name="schedule" color="coral" />}
          onPress={() => Alert.alert('Shift info', 'Current shift: 6:00 AM to 2:00 PM')}
        />
        <ListRow
          title="Raise alert"
          subtitle="Notify the society admin"
          left={<IconSymbol name="warning_amber" color="warning" />}
          onPress={() => router.push('/(guard)/(menu)/alerts' as Href)}
        />
        <ListRow
          title="Settings"
          subtitle="Notification and app preferences"
          left={<IconSymbol name="settings" color="coral" />}
          onPress={() => Alert.alert('Settings', 'Guard settings will ship in a later phase.')}
        />
      </Card>

      <Card padding="none" className="overflow-hidden">
        <ListRow title="Sign out" subtitle="Leave this device" left={<IconSymbol name="lock" color="error" />} onPress={handleSignOut} />
      </Card>
    </Screen>
  );
}
