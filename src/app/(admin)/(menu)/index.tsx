import { router } from 'expo-router';

import { Button, Card, ListRow, Screen, Text } from '@/components';
import { useAuthStore } from '@/stores/authStore';

export default function AdminMenuScreen() {
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/onboarding');
  };

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <Card className="gap-sm">
        <Text variant="title">{profile?.full_name ?? 'Admin'}</Text>
        <Text variant="body" color="textSecondary">
          Society administrator
        </Text>
      </Card>
      <Card padding="none" className="overflow-hidden">
        <ListRow title="Notifications" subtitle="Complaints, notices, and payments" showChevron onPress={() => router.push('/(admin)/(menu)/notifications' as never)} />
        <ListRow title="Society settings" subtitle="Name, address, city, logo" showChevron onPress={() => router.push('/(admin)/(menu)/society-settings' as never)} />
        <ListRow title="Profile" subtitle="Name, phone, and avatar" showChevron onPress={() => router.push('/(admin)/(menu)/profile' as never)} />
      </Card>
      <Button label="Sign out" variant="outlined" onPress={handleSignOut} />
    </Screen>
  );
}
