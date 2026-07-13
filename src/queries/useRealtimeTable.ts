import { useEffect, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

type RealtimeEvent = '*' | 'INSERT' | 'UPDATE' | 'DELETE';

interface UseRealtimeTableOptions {
  debounceMs?: number;
  enabled?: boolean;
  event?: RealtimeEvent;
  filter?: string;
  invalidateKeys: unknown[][];
  table: string;
}

function channelName(table: string, filter?: string) {
  return `realtime-${table}-${filter ?? 'all'}`.replace(/[^a-zA-Z0-9_-]/g, '-');
}

export function useRealtimeTable({
  debounceMs = 200,
  enabled = true,
  event = '*',
  filter,
  invalidateKeys,
  table,
}: UseRealtimeTableOptions) {
  const queryClient = useQueryClient();
  const invalidateKeysRef = useRef(invalidateKeys);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const invalidateKeyHash = useMemo(() => JSON.stringify(invalidateKeys), [invalidateKeys]);
  invalidateKeysRef.current = invalidateKeys;

  useEffect(() => {
    if (!enabled) return;

    const flushInvalidations = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        for (const key of invalidateKeysRef.current) {
          queryClient.invalidateQueries({ queryKey: key });
        }
      }, debounceMs);
    };

    const channel = supabase
      .channel(channelName(table, filter))
      .on(
        'postgres_changes',
        { event, schema: 'public', table, filter },
        flushInvalidations,
      )
      .subscribe();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      supabase.removeChannel(channel);
    };
  }, [debounceMs, enabled, event, filter, invalidateKeyHash, queryClient, table]);
}
