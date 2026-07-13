import { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { Screen } from '@/components';

export default function RootIndex() {
  const { session, profile, isBootstrapping, hasSeenOnboarding } = useAuthStore();
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!isBootstrapping && profile?.status === 'blocked' && !signingOut) {
      setSigningOut(true);
      useAuthStore.getState().signOut();
    }
  }, [isBootstrapping, profile?.status, signingOut]);

  if (signingOut) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator size="large" colorClassName="accent-coral" />
      </Screen>
    );
  }

  if (!session) {
    return <Redirect href={hasSeenOnboarding ? '/(auth)/sign-in' : '/(auth)/onboarding'} />;
  }

  if (!profile) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (!profile.society_id) {
    return <Redirect href="/(auth)/join-society" />;
  }

  if (profile.status === 'pending') {
    return <Redirect href="/(auth)/pending-approval" />;
  }

  switch (profile.role) {
    case 'resident':
      return <Redirect href="/(resident)/(home)" />;
    case 'guard':
      return <Redirect href="/(guard)" />;
    case 'admin':
      return <Redirect href="/(admin)" />;
    default:
      return <Redirect href="/(auth)/sign-in" />;
  }
}
