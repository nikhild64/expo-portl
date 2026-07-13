import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';

import { queryClient } from '@/lib/queryClient';
import { registerPushToken, unregisterPushToken } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];

const ONBOARDED_KEY = 'portl:onboarded';
const PASSWORD_RESET_REDIRECT_URL = Linking.createURL('reset-password', {
  scheme: 'portl-nd',
});

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  isBootstrapping: boolean;
  hasSeenOnboarding: boolean;
  bootstrap: () => Promise<void>;
  setOnboarded: () => Promise<void>;
  signIn: (input: { email: string; password: string }) => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  setRecoverySessionFromUrl: (url: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  signUp: (input: { email: string; password: string; fullName: string }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

let authListenerCleanup: (() => void) | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  isBootstrapping: true,
  hasSeenOnboarding: false,

  bootstrap: async () => {
    const [{ data }, onboardedVal] = await Promise.all([
      supabase.auth.getSession(),
      AsyncStorage.getItem(ONBOARDED_KEY),
    ]);
    set({ session: data.session, hasSeenOnboarding: onboardedVal === 'true' });
    if (data.session) await get().refreshProfile();
    set({ isBootstrapping: false });

    authListenerCleanup?.();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      set({ session });
      if (event === 'INITIAL_SESSION') return;
      if (session) await get().refreshProfile();
      else set({ profile: null });
    });
    authListenerCleanup = () => subscription.unsubscribe();
  },

  setOnboarded: async () => {
    await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
    set({ hasSeenOnboarding: true });
  },

  refreshProfile: async () => {
    const { session } = get();
    if (!session) return;
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
    if (data?.status === 'active') {
      registerPushToken(data.id).catch((err) =>
        console.warn('[push] register failed', err),
      );
    }
  },

  signIn: async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    set({ session: data.session });
    await get().refreshProfile();
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

  signUp: async ({ email, password, fullName }) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        full_name: fullName,
        role: 'resident',
        status: 'pending',
      });
      if (profileError) throw profileError;
      await get().refreshProfile();
    }
  },

  signOut: async () => {
    await unregisterPushToken().catch(() => undefined);
    await supabase.auth.signOut();
    queryClient.clear();
    set({ session: null, profile: null });
  },
}));

function getUrlParams(url: string) {
  const query = url.includes('?') ? url.split('?')[1].split('#')[0] : '';
  const fragment = url.includes('#') ? url.split('#')[1] : '';
  return new URLSearchParams([query, fragment].filter(Boolean).join('&'));
}
