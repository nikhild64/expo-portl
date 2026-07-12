import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';

import { Screen, Text, Button, EmptyState } from '@/components';
import { useAuthStore } from '@/stores/authStore';

export default function PendingApproval() {
  const [refreshing, setRefreshing] = useState(false);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const signOut = useAuthStore((s) => s.signOut);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/onboarding');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshProfile();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center', gap: 24 }}>
        <EmptyState
          icon="schedule"
          title="Waiting for admin approval"
          subtitle="Your society admin will approve your join request within 24 hours. You'll be able to access the app once approved."
        />
        <View style={{ gap: 12 }}>
          <Button
            label="Refresh status"
            variant="tonal"
            onPress={handleRefresh}
            loading={refreshing}
            full
          />
          <Button
            label="Sign out"
            variant="outlined"
            onPress={handleSignOut}
            full
          />
        </View>
      </View>
    </Screen>
  );
}
