import { useQuery } from '@tanstack/react-query';

import { endOfTodayIso, startOfTodayIso } from '@/lib/format';
import { supabase } from '@/lib/supabase';

export function useInsideCount(societyId?: string | null) {
  return useQuery({
    queryKey: ['guard-stats', 'inside', societyId],
    enabled: !!societyId,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('visitors')
        .select('*', { count: 'exact', head: true })
        .eq('society_id', societyId!)
        .gte('entered_at', startOfTodayIso())
        .lte('entered_at', endOfTodayIso())
        .not('entered_at', 'is', null)
        .is('exited_at', null);

      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function usePendingApprovalsCount(societyId?: string | null) {
  return useQuery({
    queryKey: ['guard-stats', 'pending', societyId],
    enabled: !!societyId,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('visitors')
        .select('*', { count: 'exact', head: true })
        .eq('society_id', societyId!)
        .eq('status', 'pending')
        .gte('requested_at', startOfTodayIso())
        .lte('requested_at', endOfTodayIso());

      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useTodayVisitorsCount(societyId?: string | null) {
  return useQuery({
    queryKey: ['guard-stats', 'today', societyId],
    enabled: !!societyId,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('visitors')
        .select('*', { count: 'exact', head: true })
        .eq('society_id', societyId!)
        .gte('requested_at', startOfTodayIso())
        .lte('requested_at', endOfTodayIso());

      if (error) throw error;
      return count ?? 0;
    },
  });
}
