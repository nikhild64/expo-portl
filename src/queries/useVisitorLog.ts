import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';

import { visitorLogRangeBounds, type VisitorLogDateRange } from '@/lib/format';
import { invalidateGuardActivity } from '@/lib/guardQueries';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

type Visitor = Tables<'visitors'>;

export type VisitorLogRow = Pick<
  Visitor,
  | 'id'
  | 'flat_id'
  | 'visitor_name'
  | 'visitor_phone'
  | 'visitor_photo_path'
  | 'type'
  | 'status'
  | 'requested_at'
  | 'entered_at'
  | 'exited_at'
> & {
  flats: { number: string; tower_id: string; towers: { name: string } | null } | null;
};

export type { VisitorLogDateRange } from '@/lib/format';

export function useVisitorLog(
  societyId?: string | null,
  towerId?: string | null,
  dateRange: VisitorLogDateRange = 'today',
) {
  return useQuery({
    queryKey: ['visitor-log', societyId, towerId, dateRange],
    enabled: !!societyId,
    queryFn: async () => {
      if (!societyId) return [];

      const { start, end } = visitorLogRangeBounds(dateRange);
      const flatsEmbed = towerId
        ? 'flats!inner(number, tower_id, towers(name))'
        : 'flats(number, tower_id, towers(name))';

      let query = supabase
        .from('visitors')
        .select(
          `id, flat_id, visitor_name, visitor_phone, visitor_photo_path, type, status, requested_at, entered_at, exited_at, ${flatsEmbed}`,
        )
        .eq('society_id', societyId)
        .or(
          `and(requested_at.gte.${start},requested_at.lte.${end}),and(entered_at.gte.${start},entered_at.lte.${end})`,
        );

      if (towerId) {
        query = query.eq('flats.tower_id', towerId);
      }

      const { data, error } = await query.order('requested_at', { ascending: false }).limit(100);
      if (error) throw error;
      return (data ?? []) as VisitorLogRow[];
    },
  });
}

export function useCancelVisitorRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (visitorId: string) => {
      const { error } = await supabase.from('visitors').update({ status: 'expired' }).eq('id', visitorId);
      if (error) throw error;
    },
    onSuccess: () => {
      void invalidateGuardActivity(queryClient);
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
    },
  });
}

export function useMarkExit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (visitorId: string) => {
      const { error } = await supabase
        .from('visitors')
        .update({ exited_at: new Date().toISOString(), status: 'exited' })
        .eq('id', visitorId);
      if (error) throw error;
    },
    onMutate: async (visitorId) => {
      await queryClient.cancelQueries({ queryKey: ['visitor-log'] });
      await queryClient.cancelQueries({ queryKey: ['visitors', 'detail', visitorId] });

      const previousLog = queryClient.getQueriesData<VisitorLogRow[]>({ queryKey: ['visitor-log'] });
      const previousDetail = queryClient.getQueriesData<Visitor>({ queryKey: ['visitors', 'detail', visitorId] });
      const exitedAt = new Date().toISOString();

      queryClient.setQueriesData<VisitorLogRow[]>({ queryKey: ['visitor-log'] }, (old) =>
        old?.map((visitor) =>
          visitor.id === visitorId ? { ...visitor, exited_at: exitedAt, status: 'exited' } : visitor,
        ),
      );
      queryClient.setQueriesData<Visitor>({ queryKey: ['visitors', 'detail', visitorId] }, (old) =>
        old ? { ...old, exited_at: exitedAt, status: 'exited' } : old,
      );

      return { previousDetail, previousLog };
    },
    onError: (_error, _variables, context) => {
      context?.previousLog.forEach(([key, data]) => queryClient.setQueryData(key, data));
      context?.previousDetail.forEach(([key, data]) => queryClient.setQueryData(key, data));
      queryClient.invalidateQueries({ queryKey: ['visitor-log'] });
      void invalidateGuardActivity(queryClient);
    },
    onSuccess: () => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      void invalidateGuardActivity(queryClient);
    },
  });
}

export function useMarkEntered(visitorId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!visitorId) throw new Error('Visitor not found');

      const { error } = await supabase
        .from('visitors')
        .update({ entered_at: new Date().toISOString(), status: 'entered' })
        .eq('id', visitorId);
      if (error) throw error;
    },
    onMutate: async () => {
      if (!visitorId) return undefined;

      await queryClient.cancelQueries({ queryKey: ['visitor-log'] });
      await queryClient.cancelQueries({ queryKey: ['visitors', 'detail', visitorId] });
      await queryClient.cancelQueries({ queryKey: ['visitors', 'verify', visitorId] });

      const previousLog = queryClient.getQueriesData<VisitorLogRow[]>({ queryKey: ['visitor-log'] });
      const previousDetail = queryClient.getQueriesData<Visitor>({ queryKey: ['visitors', 'detail', visitorId] });
      const previousVerify = queryClient.getQueriesData<unknown>({ queryKey: ['visitors', 'verify', visitorId] });
      const enteredAt = new Date().toISOString();

      queryClient.setQueriesData<VisitorLogRow[]>({ queryKey: ['visitor-log'] }, (old) =>
        old?.map((visitor) =>
          visitor.id === visitorId ? { ...visitor, entered_at: enteredAt, status: 'entered' } : visitor,
        ),
      );
      queryClient.setQueriesData<Visitor>({ queryKey: ['visitors', 'detail', visitorId] }, (old) =>
        old ? { ...old, entered_at: enteredAt, status: 'entered' } : old,
      );
      queryClient.setQueriesData<unknown>({ queryKey: ['visitors', 'verify', visitorId] }, (old: unknown) =>
        old && typeof old === 'object' ? { ...old, entered_at: enteredAt, status: 'entered' } : old,
      );

      return { previousDetail, previousLog, previousVerify };
    },
    onError: (_error, _variables, context) => {
      context?.previousLog.forEach(([key, data]) => queryClient.setQueryData(key, data));
      context?.previousDetail.forEach(([key, data]) => queryClient.setQueryData(key, data));
      context?.previousVerify.forEach(([key, data]) => queryClient.setQueryData(key, data));
      queryClient.invalidateQueries({ queryKey: ['visitor-log'] });
      void invalidateGuardActivity(queryClient);
      if (visitorId) {
        queryClient.invalidateQueries({ queryKey: ['visitors', 'detail', visitorId] });
        queryClient.invalidateQueries({ queryKey: ['visitors', 'verify', visitorId] });
      }
    },
    onSuccess: () => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      void invalidateGuardActivity(queryClient);
    },
  });
}
