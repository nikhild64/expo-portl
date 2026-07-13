import { useState } from 'react';
import { View } from 'react-native';

import { Screen, Button, EmptyState, Text } from '@/components';
import { useAuthStore } from '@/stores/authStore';

export default function PendingApproval() {
  const [refreshing, setRefreshing] = useState(false);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const signOut = useAuthStore((s) => s.signOut);
  const profile = useAuthStore((s) => s.profile);
  const isGuard = profile?.role === 'guard';

  const handleSignOut = async () => {
    await signOut();
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
      <View className="flex-1 justify-center gap-lg">
        <EmptyState
          icon="schedule"
          title="Waiting for admin approval"
          subtitle={
            isGuard
              ? 'Your society admin will approve guard access within 24 hours. You can sign in to the guard app once approved.'
              : 'Your society admin will approve your join request within 24 hours. You will be able to access the app once approved.'
          }
        />
        <View className="gap-sm">
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
