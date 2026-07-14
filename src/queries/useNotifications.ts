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
      if (!uid) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('profile_id', uid)
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
    queryFn: async () => {
      if (!uid) return 0;

      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('profile_id', uid)
        .is('read_at', null);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

function patchNotificationRead(
  queryClient: ReturnType<typeof useQueryClient>,
  uid: string | undefined,
  notificationId: string,
  readAt: string,
) {
  queryClient.setQueryData<NotificationRow[]>(['notifications', 'list', uid], (old) =>
    old?.map((row) => (row.id === notificationId ? { ...row, read_at: readAt } : row)),
  );
  queryClient.setQueryData<number>(['notifications', 'unread-count', uid], (old = 0) => Math.max(0, old - 1));
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
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: ['notifications', 'list', uid] });
      await queryClient.cancelQueries({ queryKey: ['notifications', 'unread-count', uid] });

      const previousList = queryClient.getQueryData<NotificationRow[]>(['notifications', 'list', uid]);
      const previousCount = queryClient.getQueryData<number>(['notifications', 'unread-count', uid]);
      const readAt = new Date().toISOString();
      const wasUnread = previousList?.find((row) => row.id === notificationId && !row.read_at);

      if (wasUnread) patchNotificationRead(queryClient, uid, notificationId, readAt);

      return { previousList, previousCount, wasUnread: !!wasUnread };
    },
    onError: (_error, _id, context) => {
      queryClient.setQueryData(['notifications', 'list', uid], context?.previousList);
      queryClient.setQueryData(['notifications', 'unread-count', uid], context?.previousCount);
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
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications', 'list', uid] });
      await queryClient.cancelQueries({ queryKey: ['notifications', 'unread-count', uid] });

      const previousList = queryClient.getQueryData<NotificationRow[]>(['notifications', 'list', uid]);
      const previousCount = queryClient.getQueryData<number>(['notifications', 'unread-count', uid]);
      const readAt = new Date().toISOString();

      queryClient.setQueryData<NotificationRow[]>(['notifications', 'list', uid], (old) =>
        old?.map((row) => (row.read_at ? row : { ...row, read_at: readAt })),
      );
      queryClient.setQueryData(['notifications', 'unread-count', uid], 0);

      return { previousList, previousCount };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(['notifications', 'list', uid], context?.previousList);
      queryClient.setQueryData(['notifications', 'unread-count', uid], context?.previousCount);
    },
  });
}
