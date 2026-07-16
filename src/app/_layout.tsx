import '../global.css';
import '@/i18n';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DialogProvider, ErrorBoundary, OfflineBanner, BootstrapGate, SignOutOverlay } from '@/components';
import { SentryAuthScope } from '@/components/SentryAuthScope';
import { Sentry, sentryEnabled } from '@/lib/sentry';
import { NavigationSegmentsBridge } from '@/components/NavigationSegmentsBridge';
import { NotificationsRealtimeBridge } from '@/components/NotificationsRealtimeBridge';
import { setupNotifications, registerPushToken } from '@/lib/notifications';
import { subscribeToNotificationReceived } from '@/lib/notificationReceivedListener';
import { subscribeToNotificationTaps } from '@/lib/notificationTapListener';
import { queryClient } from '@/lib/queryClient';
import { stackTransition } from '@/lib/stackScreenOptions';
import { applyThemePreference, loadThemePreference } from '@/lib/themePreference';
import { applyLocalePreference, loadLocalePreference, syncLocalePreferenceToProfile } from '@/lib/localePreference';
import { useAppFonts } from '@/lib/useAppFonts';
import { useAuthStore } from '@/stores/authStore';

SplashScreen.preventAutoHideAsync();

const PROFILE_REFRESH_TTL_MS = 5 * 60 * 1000;
let lastForegroundProfileRefresh = 0;

function RootLayout() {
  const { fontsLoaded, fontsError } = useAppFonts();
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping);
  const session = useAuthStore((s) => s.session);
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
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    setupNotifications().catch((error) => console.warn('[push] channel setup failed', error));
    const unsubscribeTaps = subscribeToNotificationTaps();
    const unsubscribeReceived = subscribeToNotificationReceived();
    return () => {
      unsubscribeTaps();
      unsubscribeReceived();
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const becameActive = appState.current.match(/inactive|background/) && nextState === 'active';
      appState.current = nextState;
      if (becameActive && useAuthStore.getState().session) {
        const { profile } = useAuthStore.getState();
        const now = Date.now();
        if (now - lastForegroundProfileRefresh >= PROFILE_REFRESH_TTL_MS) {
          lastForegroundProfileRefresh = now;
          useAuthStore.getState().refreshProfile().catch((error) => console.warn('[auth] profile refresh failed', error));
        }
        if (profile?.status === 'active') {
          // Re-register on every foreground so FCM token rotations and account switches
          // refresh push_tokens (session cache would otherwise skip until sign-out).
          registerPushToken(profile.id, { force: true }).catch((error) =>
            console.warn('[push] foreground register failed', error),
          );
        }
      }
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!appReady || !session) return;
    void syncLocalePreferenceToProfile();
  }, [appReady, session]);

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
          <BootstrapGate>
            <QueryClientProvider client={queryClient}>
              <NotificationsRealtimeBridge />
              <BottomSheetModalProvider>
                <DialogProvider>
                  <SentryAuthScope />
                  <StatusBar style="auto" translucent backgroundColor="transparent" />
                  <NavigationSegmentsBridge />
                  <OfflineBanner />
                  <View className="relative flex-1">
                    <Stack screenOptions={{ headerShown: false, ...stackTransition }} />
                    <SignOutOverlay />
                  </View>
                </DialogProvider>
              </BottomSheetModalProvider>
            </QueryClientProvider>
          </BootstrapGate>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

export default sentryEnabled ? Sentry.wrap(RootLayout) : RootLayout;
