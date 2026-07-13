import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function RootIndex() {
  const { session, profile, isBootstrapping, hasSeenOnboarding, bootstrap } = useAuthStore();
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (!isBootstrapping && profile?.status === 'blocked' && !signingOut) {
      setSigningOut(true);
      useAuthStore.getState().signOut();
    }
  }, [isBootstrapping, profile?.status, signingOut]);

  if (isBootstrapping || signingOut) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF7F5' }}>
        <ActivityIndicator size="large" color="#F97066" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href={hasSeenOnboarding ? '/(auth)/sign-in' : '/(auth)/onboarding'} />;
  }

  if (!profile || profile.status === 'pending') {
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
