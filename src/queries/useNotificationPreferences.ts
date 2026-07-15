import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

export { useQueryRefresh } from '@/hooks/useQueryRefresh';

export type NotificationPreferenceKey = 'visitors' | 'notices' | 'polls' | 'payments' | 'complaints';

const defaultPreferences: Record<NotificationPreferenceKey, boolean> = {
  visitors: true,
  notices: true,
  polls: true,
  payments: true,
  complaints: true,
};

export function useNotificationPreferences() {
  const uid = useAuthStore((s) => s.session?.user.id);

  return useQuery({
    queryKey: ['notification-preferences', uid],
    enabled: !!uid,
    queryFn: async () => {
      if (!uid) return defaultPreferences;

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('visitors, notices, polls, payments, complaints')
        .eq('profile_id', uid)
        .maybeSingle();

      if (error) throw error;
      return { ...defaultPreferences, ...data };
    },
  });
}

export function useUpdateNotificationPreferences() {
  const uid = useAuthStore((s) => s.session?.user.id);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (prefs: Partial<Record<NotificationPreferenceKey, boolean>>) => {
      if (!uid) throw new Error('Not signed in');
      const { error } = await supabase.from('notification_preferences').upsert({
        profile_id: uid,
        ...prefs,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notification-preferences', uid] }),
  });
}

