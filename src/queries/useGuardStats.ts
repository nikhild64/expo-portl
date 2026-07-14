import { useQuery } from '@tanstack/react-query';

import { endOfTodayIso, startOfTodayIso } from '@/lib/format';
import { supabase } from '@/lib/supabase';

export type GuardStats = {
  inside: number;
  pending: number;
  today: number;
};

export function useGuardStats(societyId?: string | null) {
  return useQuery({
    queryKey: ['guard-stats', societyId],
    enabled: !!societyId,
    queryFn: async (): Promise<GuardStats> => {
      if (!societyId) return { inside: 0, pending: 0, today: 0 };

      const start = startOfTodayIso();
      const end = endOfTodayIso();
      const { data, error } = await supabase
        .from('visitors')
        .select('status, requested_at, entered_at, exited_at')
        .eq('society_id', societyId)
        .or(
          `and(requested_at.gte.${start},requested_at.lte.${end}),and(entered_at.gte.${start},entered_at.lte.${end},exited_at.is.null)`,
        );

      if (error) throw error;

      let inside = 0;
      let pending = 0;
      let today = 0;

      for (const visitor of data ?? []) {
        const requestedToday =
          !!visitor.requested_at && visitor.requested_at >= start && visitor.requested_at <= end;
        if (requestedToday) {
          today += 1;
          if (visitor.status === 'pending') pending += 1;
        }
        if (
          visitor.entered_at &&
          visitor.entered_at >= start &&
          visitor.entered_at <= end &&
          !visitor.exited_at
        ) {
          inside += 1;
        }
      }

      return { inside, pending, today };
    },
  });
}

/** @deprecated Use useGuardStats */
export function useInsideCount(societyId?: string | null) {
  const query = useGuardStats(societyId);
  return { ...query, data: query.data?.inside };
}

/** @deprecated Use useGuardStats */
export function usePendingApprovalsCount(societyId?: string | null) {
  const query = useGuardStats(societyId);
  return { ...query, data: query.data?.pending };
}

/** @deprecated Use useGuardStats */
export function useTodayVisitorsCount(societyId?: string | null) {
  const query = useGuardStats(societyId);
  return { ...query, data: query.data?.today };
}
