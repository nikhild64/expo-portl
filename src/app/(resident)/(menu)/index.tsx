import { Alert } from 'react-native';
import { router } from 'expo-router';

import { Avatar, Card, IconSymbol, ListRow, Screen } from '@/components';
import { useAuthStore } from '@/stores/authStore';

const rows = [
  { icon: 'notifications', title: 'Notifications', href: '/(resident)/(menu)/notifications' },
  { icon: 'person', title: 'Profile', href: '/(resident)/(menu)/profile' },
  { icon: 'construction', title: 'My complaints', href: '/(resident)/(menu)/complaints' },
  { icon: 'calendar_today', title: 'My bookings', href: '/(resident)/(menu)/amenities' },
  { icon: 'calendar_today', title: 'Book amenity', href: '/(resident)/(menu)/amenities' },
  { icon: 'directions_car', title: 'Vehicles', href: '/(resident)/(menu)/vehicles' },
  { icon: 'groups', title: 'Family', href: '/(resident)/(menu)/family' },
  { icon: 'history', title: 'Visitor history', href: '/(resident)/(menu)/visitor-history' },
  { icon: 'settings', title: 'Settings', href: '/(resident)/(menu)/settings' },
] as const;

export default function MenuScreen() {
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);

  const handleSignOut = () => {
    Alert.alert('Sign out?', 'You will return to the sign-in screen.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/sign-in');
        },
      },
    ]);
  };

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <Card padding="none" className="overflow-hidden">
        {rows.map((row) => (
          <ListRow
            key={row.title}
            left={<IconSymbol name={row.icon} color="coral" />}
            title={row.title}
            onPress={() => router.push(row.href)}
          />
        ))}
      </Card>
      <Card padding="none" className="overflow-hidden">
        <ListRow
          left={<Avatar name={profile?.full_name ?? 'Resident'} uri={profile?.avatar_url ?? undefined} size="md" />}
          title="Sign out"
          subtitle={profile?.full_name}
          onPress={handleSignOut}
        />
      </Card>
    </Screen>
  );
}
