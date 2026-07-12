import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];

const ONBOARDED_KEY = 'portl:onboarded';

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  isBootstrapping: boolean;
  hasSeenOnboarding: boolean;
  bootstrap: () => Promise<void>;
  setOnboarded: () => Promise<void>;
  signIn: (input: { email: string; password: string }) => Promise<void>;
  signUp: (input: { email: string; password: string; fullName: string }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

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

    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ session });
      if (session) await get().refreshProfile();
      else set({ profile: null });
    });
  },

  setOnboarded: async () => {
    await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
    set({ hasSeenOnboarding: true });
  },

  refreshProfile: async () => {
    const { session } = get();
    if (!session) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    set({ profile: data ?? null });
  },

  signIn: async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    set({ session: data.session });
    await get().refreshProfile();
  },

  signUp: async ({ email, password, fullName }) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        full_name: fullName,
        role: 'resident',
        status: 'pending',
      });
      await get().refreshProfile();
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, profile: null });
  },
}));
