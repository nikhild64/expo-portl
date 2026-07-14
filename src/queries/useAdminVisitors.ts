import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { supabase } from '@/lib/supabase';
import { adminVisitorHistorySelect } from '@/queries/supabaseSelects';
import type { Tables } from '@/types/database';

export function useAdminVisitorHistory(societyId?: string | null, filters: { from?: string; to?: string; status?: Tables<'visitors'>['status'] | 'all'; search?: string } = {}) {
  const debouncedSearch = useDebouncedValue(filters.search?.trim() ?? '');

  return useQuery({
    queryKey: ['admin-visitors', societyId, filters.from, filters.to, filters.status, debouncedSearch],
    enabled: !!societyId,
    queryFn: async () => {
      if (!societyId) return [];

      let query = adminVisitorHistorySelect()
        .eq('society_id', societyId)
        .order('requested_at', { ascending: false })
        .limit(200);
      if (filters.from) query = query.gte('requested_at', filters.from);
      if (filters.to) query = query.lte('requested_at', filters.to);
      if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status);
      if (debouncedSearch) query = query.ilike('visitor_name', `%${debouncedSearch}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useLiveGateFeed(societyId?: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['gate-feed', societyId],
    enabled: !!societyId,
    queryFn: async () => {
      if (!societyId) return [];

      const { data, error } = await supabase
        .from('visitors')
        .select('*')
        .eq('society_id', societyId)
        .order('requested_at', { ascending: false })
        .limit(40);

      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!societyId) return;

    const patchFeed = (payload: { eventType: string; new: Tables<'visitors'>; old: Tables<'visitors'> }) => {
      const key = ['gate-feed', societyId];
      const visitor = payload.eventType === 'DELETE' ? payload.old : payload.new;
      if (visitor.society_id !== societyId) return;

      queryClient.setQueryData<Tables<'visitors'>[]>(key, (old) => {
        const list = old ?? [];
        if (payload.eventType === 'DELETE') return list.filter((row) => row.id !== visitor.id);
        const index = list.findIndex((row) => row.id === visitor.id);
        const next = index >= 0 ? list.map((row, i) => (i === index ? visitor : row)) : [visitor, ...list];
        return next.slice(0, 40);
      });
    };

    const channel = supabase
      .channel(`gate-feed-${societyId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'visitors', filter: `society_id=eq.${societyId}` },
        (payload) => patchFeed(payload as unknown as { eventType: string; new: Tables<'visitors'>; old: Tables<'visitors'> }),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient, societyId]);

  return query;
}
