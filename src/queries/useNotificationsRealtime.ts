import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { invalidateQueriesForNotificationCategory } from '@/lib/notificationQueryInvalidation';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

const DEBOUNCE_MS = 200;

function channelName(uid: string) {
  return `realtime-notifications-${uid}`;
}

/** Single app-wide notifications subscription (avoids duplicate channels from BellButton + list). */
export function useNotificationsRealtime() {
  const uid = useAuthStore((s) => s.session?.user.id);
  const queryClient = useQueryClient();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const categoriesRef = useRef(new Set<string>());

  useEffect(() => {
    if (!uid) return;

    const categorySet = categoriesRef.current;

    const flushInvalidations = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['notifications', 'list', uid] });
        queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count', uid] });

        for (const category of categorySet) {
          invalidateQueriesForNotificationCategory(queryClient, category);
        }
        categorySet.clear();
      }, DEBOUNCE_MS);
    };

    const channel = supabase
      .channel(channelName(uid))
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `profile_id=eq.${uid}` },
        (payload) => {
          const category = (payload.new as { category?: string } | null)?.category;
          if (category) categorySet.add(category);
          flushInvalidations();
        },
      )
      .subscribe();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      categorySet.clear();
      supabase.removeChannel(channel);
    };
  }, [queryClient, uid]);
}
