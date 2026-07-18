import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';

import { env } from '@/env';
import i18n from '@/i18n';
import { registerAuthUserIdGetter } from '@/lib/authSession';
import { errorMessage } from '@/lib/alert';
import { queryClient } from '@/lib/queryClient';
import { clearOfflineQueue } from '@/lib/offlineQueue';
import { registerPushToken, unregisterPushToken } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];

export type AuthTransition = 'signIn' | 'signUp' | 'joinSociety' | 'signOut';

const ONBOARDED_KEY = 'portl:onboarded';
const MIN_TRANSITION_MS = 500;
const SIGN_OUT_TRANSITION_MS = 400;
const PASSWORD_RESET_REDIRECT_URL = Linking.createURL('reset-password', {
  scheme: 'portl-nd',
});

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  isBootstrapping: boolean;
  authTransition: AuthTransition | null;
  bootstrapError: string | null;
  hasSeenOnboarding: boolean;
  bootstrap: () => Promise<void>;
  retryBootstrap: () => Promise<void>;
  setOnboarded: () => Promise<void>;
  beginAuthTransition: (kind: AuthTransition) => void;
  endAuthTransition: (options?: { immediate?: boolean }) => void;
  signIn: (input: { email: string; password: string }) => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  setRecoverySessionFromUrl: (url: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  signUp: (input: { email: string; password: string; fullName: string; role?: 'resident' | 'guard' }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: (options?: { force?: boolean }) => Promise<void>;
}

let authListenerCleanup: (() => void) | null = null;
let transitionStartedAt = 0;

/** Non-blocking; deduped inside registerPushToken unless force is needed. */
function schedulePushRegistration(profileId: string) {
  void registerPushToken(profileId).catch((err) =>
    console.warn('[push] register failed', err),
  );
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  isBootstrapping: true,
  authTransition: null,
  bootstrapError: null,
  hasSeenOnboarding: false,

  beginAuthTransition: (kind) => {
    transitionStartedAt = Date.now();
    set({ authTransition: kind });
  },

  endAuthTransition: (options) => {
    const elapsed = Date.now() - transitionStartedAt;
    const delay = options?.immediate ? 0 : Math.max(0, MIN_TRANSITION_MS - elapsed);
    if (delay === 0) {
      set({ authTransition: null });
      return;
    }
    setTimeout(() => set({ authTransition: null }), delay);
  },

  bootstrap: async () => {
    set({ bootstrapError: null, isBootstrapping: true });
    try {
      const [{ data }, onboardedVal] = await Promise.all([
        supabase.auth.getSession(),
        AsyncStorage.getItem(ONBOARDED_KEY),
      ]);
      set({ session: data.session, hasSeenOnboarding: onboardedVal === 'true' });
      if (data.session) {
        await get().refreshProfile();
        const profile = get().profile;
        if (profile?.status === 'active') schedulePushRegistration(profile.id);
      }

      authListenerCleanup?.();
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        set({ session });
        if (event === 'INITIAL_SESSION') return;
        if (session) {
          await get().refreshProfile();
          if (event === 'SIGNED_IN') {
            const profile = get().profile;
            if (profile?.status === 'active') schedulePushRegistration(profile.id);
          }
        } else {
          set({ profile: null });
        }
      });
      authListenerCleanup = () => subscription.unsubscribe();
    } catch (error) {
      console.warn('[auth] bootstrap failed', error);
      set({ bootstrapError: errorMessage(error, i18n.t('common.startupFailed')) });
    } finally {
      set({ isBootstrapping: false });
    }
  },

  retryBootstrap: async () => {
    await get().bootstrap();
  },

  setOnboarded: async () => {
    await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
    set({ hasSeenOnboarding: true });
  },

  refreshProfile: async (options) => {
    const { session, profile } = get();
    if (!session) return;
    if (!options?.force && profile?.id === session.user.id) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    if (error) {
      console.warn('[auth] profile fetch failed', error.message);
      set({ profile: null });
      return;
    }
    set({ profile: data ?? null });
  },

  signIn: async ({ email, password }) => {
    get().beginAuthTransition('signIn');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      set({ session: data.session });
      await get().refreshProfile();
    } catch (error) {
      get().endAuthTransition({ immediate: true });
      throw error;
    }
  },

  sendPasswordResetEmail: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: PASSWORD_RESET_REDIRECT_URL,
    });
    if (error) throw error;
  },

  setRecoverySessionFromUrl: async (url) => {
    const params = getUrlParams(url);
    const linkError = params.get('error_description') ?? params.get('error');
    if (linkError) throw new Error(decodeURIComponent(linkError.replace(/\+/g, ' ')));

    const code = params.get('code');
    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
      set({ session: data.session });
      return;
    }

    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    if (accessToken && refreshToken) {
      assertSupabaseIssuer(accessToken);
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) throw error;
      set({ session: data.session });
    }
  },

  updatePassword: async (password) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    await get().signOut();
  },

  signUp: async ({ email, password, fullName, role = 'resident' }) => {
    get().beginAuthTransition('signUp');
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: fullName,
            full_name: fullName,
          },
        },
      });
      if (error) throw error;
      if (!data.user) return;

      set({ session: data.session });
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        full_name: fullName,
        role,
        status: 'pending',
      });
      if (profileError) throw profileError;
      await get().refreshProfile();
    } catch (error) {
      get().endAuthTransition({ immediate: true });
      throw error;
    }
  },

  signOut: async () => {
    const { hasSeenOnboarding, session } = get();
    const userId = session?.user.id;
    const target = hasSeenOnboarding ? '/(auth)/sign-in' : '/(auth)/onboarding';

    get().beginAuthTransition('signOut');
    router.replace(target);

    try {
      await unregisterPushToken().catch(() => undefined);
      await clearOfflineQueue(userId);
      await supabase.auth.signOut();
      queryClient.clear();
      set({ session: null, profile: null });
    } finally {
      setTimeout(() => get().endAuthTransition({ immediate: true }), SIGN_OUT_TRANSITION_MS);
    }
  },
}));

registerAuthUserIdGetter(() => useAuthStore.getState().session?.user.id);

function getUrlParams(url: string) {
  const query = url.includes('?') ? url.split('?')[1].split('#')[0] : '';
  const fragment = url.includes('#') ? url.split('#')[1] : '';
  return new URLSearchParams([query, fragment].filter(Boolean).join('&'));
}

function assertSupabaseIssuer(accessToken: string) {
  const parts = accessToken.split('.');
  if (parts.length < 2) throw new Error('Invalid recovery link.');
  const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
  const expected = `${env.supabaseUrl}/auth/v1`;
  if (payload.iss !== expected) throw new Error('Recovery link is not from this app.');
}
