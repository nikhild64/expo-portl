import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';

import { endOfTodayIso, startOfTodayIso } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

type Visitor = Tables<'visitors'>;

export type VisitorLogRow = {
  entered_at: string | null;
  exited_at: string | null;
  flat_id: string;
  id: string;
  requested_at: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'entered' | 'exited';
  type: 'guest' | 'delivery' | 'cab' | 'service';
  visitor_name: string;
  visitor_phone: string | null;
  visitor_photo_url: string | null;
  flats: { number: string; tower_id: string; towers: { name: string } | null } | null;
};

export function useVisitorLog(societyId?: string | null, towerId?: string | null) {
  return useQuery({
    queryKey: ['visitor-log', societyId, towerId],
    enabled: !!societyId,
    queryFn: async () => {
      let query = supabase
        .from('visitors')
        .select('id, flat_id, visitor_name, visitor_phone, visitor_photo_url, type, status, requested_at, entered_at, exited_at, flats!inner(number, tower_id, towers(name))')
        .eq('society_id', societyId!)
        .gte('requested_at', startOfTodayIso())
        .lte('requested_at', endOfTodayIso());

      if (towerId) {
        query = query.eq('flats.tower_id', towerId);
      }

      const { data, error } = await query.order('requested_at', { ascending: false }).limit(100);
      if (error) throw error;
      return (data ?? []) as VisitorLogRow[];
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
    },
    onSuccess: () => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    onSettled: (_data, _error, visitorId) => {
      queryClient.invalidateQueries({ queryKey: ['visitor-log'] });
      queryClient.invalidateQueries({ queryKey: ['visitors', 'detail', visitorId] });
      queryClient.invalidateQueries({ queryKey: ['guard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['guard-activity'] });
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
    },
    onSuccess: () => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['visitor-log'] });
      queryClient.invalidateQueries({ queryKey: ['visitors', 'detail', visitorId] });
      queryClient.invalidateQueries({ queryKey: ['visitors', 'verify', visitorId] });
      queryClient.invalidateQueries({ queryKey: ['guard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['guard-activity'] });
    },
  });
}
