import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

export function useAdminVisitorHistory(societyId?: string | null, filters: { from?: string; to?: string; status?: Tables<'visitors'>['status'] | 'all'; search?: string } = {}) {
  return useQuery({
    queryKey: ['admin-visitors', societyId, filters],
    enabled: !!societyId,
    queryFn: async () => {
      let query = supabase
        .from('visitors')
        .select('*, flats(number, towers(name)), profiles!visitors_guard_id_fkey(full_name)')
        .eq('society_id', societyId!)
        .order('requested_at', { ascending: false })
        .limit(200);
      if (filters.from) query = query.gte('requested_at', filters.from);
      if (filters.to) query = query.lte('requested_at', filters.to);
      if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status);
      if (filters.search?.trim()) query = query.ilike('visitor_name', `%${filters.search.trim()}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useLiveGateFeed(societyId?: string | null) {
  const [rows, setRows] = useState<Tables<'visitors'>[]>([]);

  useEffect(() => {
    if (!societyId) return;
    let active = true;

    supabase
      .from('visitors')
      .select('*')
      .eq('society_id', societyId)
      .order('requested_at', { ascending: false })
      .limit(40)
      .then(({ data }) => {
        if (active) setRows(data ?? []);
      });

    const channel = supabase
      .channel(`gate:${societyId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'visitors', filter: `society_id=eq.${societyId}` },
        (payload) => {
          const row = payload.new as Tables<'visitors'>;
          if (!row?.id) return;
          setRows((current) => [row, ...current.filter((item) => item.id !== row.id)].slice(0, 40));
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [societyId]);

  return rows;
}
