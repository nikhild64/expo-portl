import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { Tables } from '@/types/database';

export type NotificationRow = Tables<'notifications'>;

export function useNotifications() {
  const uid = useAuthStore((s) => s.session?.user.id);

  return useQuery({
    queryKey: ['notifications', 'list', uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('profile_id', uid!)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUnreadNotificationCount() {
  const uid = useAuthStore((s) => s.session?.user.id);

  return useQuery({
    queryKey: ['notifications', 'unread-count', uid],
    enabled: !!uid,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('profile_id', uid!)
        .is('read_at', null);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const uid = useAuthStore((s) => s.session?.user.id);

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .is('read_at', null);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'list', uid] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count', uid] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const uid = useAuthStore((s) => s.session?.user.id);

  return useMutation({
    mutationFn: async () => {
      if (!uid) return;
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('profile_id', uid)
        .is('read_at', null);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'list', uid] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count', uid] });
    },
  });
}
