import { View } from 'react-native';
import { router } from 'expo-router';

import { Screen, Text, Button } from '@/components';
import { useAuthStore } from '@/stores/authStore';

export default function GuardHome() {
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/onboarding');
  };

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center', gap: 16 }}>
        <Text variant="titleLarge">Guard Home</Text>
        <Text variant="body" color="textSecondary">
          Welcome, {profile?.full_name ?? 'guard'}
        </Text>
        <Text variant="footnote" color="textTertiary">
          M5 will replace this stub
        </Text>
        <Button label="Sign out" variant="outlined" onPress={handleSignOut} />
      </View>
    </Screen>
  );
}
