import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { endOfTodayIso, startOfTodayIso } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import type { PreApprovalWithCreator } from '@/queries/useVisitors';

export function useHomeRefresh() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['me', 'flat-ids'] }),
        queryClient.refetchQueries({ queryKey: ['visitors', 'pending'] }),
        queryClient.refetchQueries({ queryKey: ['pre-approvals', 'today'] }),
        queryClient.refetchQueries({ queryKey: ['notices', 'recent'] }),
        queryClient.refetchQueries({ queryKey: ['amenity-bookings', 'upcoming'] }),
        queryClient.refetchQueries({ queryKey: ['notifications', 'unread-count'] }),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  return { refreshing, refresh };
}

export function useMyFlatIds(userId?: string) {
  return useQuery({
    queryKey: ['me', 'flat-ids', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase.from('flat_residents').select('flat_id').eq('profile_id', userId);
      if (error) throw error;
      return data.map((item) => item.flat_id);
    },
  });
}

export function usePendingVisitors(flatIds: string[] | undefined) {
  return useQuery({
    queryKey: ['visitors', 'pending', flatIds],
    enabled: !!flatIds?.length,
    queryFn: async () => {
      if (!flatIds?.length) return [];

      const { data, error } = await supabase
        .from('visitors')
        .select('*')
        .in('flat_id', flatIds)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
  });
}

export function useExpectedToday(flatIds: string[] | undefined) {
  return useQuery({
    queryKey: ['pre-approvals', 'today', flatIds],
    enabled: !!flatIds?.length,
    queryFn: async () => {
      if (!flatIds?.length) return [];

      const { data, error } = await supabase
        .from('pre_approvals')
        .select('*, profiles!pre_approvals_created_by_profile_id_fkey(full_name)')
        .in('flat_id', flatIds)
        .gte('start_at', startOfTodayIso())
        .lte('start_at', endOfTodayIso())
        .or('qr_used_at.is.null,recurring.eq.true')
        .order('start_at', { ascending: true });

      if (error) throw error;
      return (data ?? []) as unknown as PreApprovalWithCreator[];
    },
  });
}

export function useRecentNotices(societyId?: string | null, limit = 3) {
  return useQuery({
    queryKey: ['notices', 'recent', societyId, limit],
    enabled: !!societyId,
    queryFn: async () => {
      if (!societyId) return [];

      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .eq('society_id', societyId)
        .order('pinned', { ascending: false })
        .order('published_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
  });
}

export function useUpcomingBooking(profileId?: string) {
  return useQuery({
    queryKey: ['amenity-bookings', 'upcoming', profileId],
    enabled: !!profileId,
    queryFn: async () => {
      if (!profileId) return null;

      const { data, error } = await supabase
        .from('amenity_bookings')
        .select('*, amenities(name)')
        .eq('profile_id', profileId)
        .gte('start_at', new Date().toISOString())
        .in('status', ['pending', 'confirmed'])
        .order('start_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
}
