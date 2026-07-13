import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

export type NotificationPreferenceKey = 'visitors' | 'notices' | 'payments' | 'complaints';

const defaultPreferences: Record<NotificationPreferenceKey, boolean> = {
  visitors: true,
  notices: true,
  payments: true,
  complaints: true,
};

export function useNotificationPreferences() {
  const uid = useAuthStore((s) => s.session?.user.id);

  return useQuery({
    queryKey: ['notification-preferences', uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('visitors, notices, payments, complaints')
        .eq('profile_id', uid!)
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

export function useQueryRefresh(queryKeys: readonly (readonly string[])[]) {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all(queryKeys.map((key) => queryClient.refetchQueries({ queryKey: key })));
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, queryKeys]);

  return { refreshing, refresh };
}
