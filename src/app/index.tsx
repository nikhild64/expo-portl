import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function RootIndex() {
  const { session, profile, isBootstrapping, hasSeenOnboarding, bootstrap } = useAuthStore();

  useEffect(() => {
    bootstrap();
  }, []);

  if (isBootstrapping) {
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

  if (profile.status === 'blocked') {
    useAuthStore.getState().signOut();
    return <Redirect href="/(auth)/sign-in" />;
  }

  switch (profile.role) {
    case 'resident':
      return <Redirect href="/(resident)/(home)/index" />;
    case 'guard':
      return <Redirect href="/(guard)" />;
    case 'admin':
      return <Redirect href="/(admin)" />;
    default:
      return <Redirect href="/(auth)/sign-in" />;
  }
}
