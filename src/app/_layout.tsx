import '../global.css';
import '@/i18n';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DialogProvider, ErrorBoundary, OfflineBanner } from '@/components';
import { setupNotifications, registerPushToken } from '@/lib/notifications';
import { subscribeToNotificationTaps } from '@/lib/notificationTapListener';
import { queryClient } from '@/lib/queryClient';
import { stackTransition } from '@/lib/stackScreenOptions';
import { applyThemePreference, loadThemePreference } from '@/lib/themePreference';
import { applyLocalePreference, loadLocalePreference } from '@/lib/localePreference';
import { useAppFonts } from '@/lib/useAppFonts';
import { useAuthStore } from '@/stores/authStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { fontsLoaded, fontsError } = useAppFonts();
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping);
  const [themeReady, setThemeReady] = useState(false);
  const [localeReady, setLocaleReady] = useState(false);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  const appReady = (fontsLoaded || fontsError) && themeReady && localeReady && !isBootstrapping;

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadThemePreference(), loadLocalePreference()])
      .then(([themeChoice, locale]) => {
        if (cancelled) return;
        applyThemePreference(themeChoice);
        applyLocalePreference(locale);
      })
      .catch((error) => console.warn('[prefs] failed to load preferences', error))
      .finally(() => {
        if (!cancelled) {
          setThemeReady(true);
          setLocaleReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    bootstrap().catch((error) => console.warn('[auth] bootstrap failed', error));
  }, [bootstrap]);

  useEffect(() => {
    setupNotifications().catch((error) => console.warn('[push] channel setup failed', error));
    return subscribeToNotificationTaps();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const becameActive = appState.current.match(/inactive|background/) && nextState === 'active';
      appState.current = nextState;
      if (becameActive && useAuthStore.getState().session) {
        const { profile } = useAuthStore.getState();
        useAuthStore.getState().refreshProfile().catch((error) => console.warn('[auth] profile refresh failed', error));
        if (profile?.status === 'active') {
          registerPushToken(profile.id, { force: true }).catch((error) =>
            console.warn('[push] foreground register failed', error),
          );
        }
      }
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (appReady) {
      SplashScreen.hideAsync();
    }
  }, [appReady]);

  if (!appReady) return null;

  return (
    <ErrorBoundary>
      <GestureHandlerRootView className="flex-1">
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <BottomSheetModalProvider>
              <DialogProvider>
                <StatusBar style="auto" translucent backgroundColor="transparent" />
                <OfflineBanner />
                <Stack screenOptions={{ headerShown: false, ...stackTransition }} />
              </DialogProvider>
            </BottomSheetModalProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
