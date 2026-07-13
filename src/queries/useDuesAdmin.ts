import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { Json, Tables } from '@/types/database';

export type DuesLineItem = { label: string; amount: number };

export function useDuesCycleStatus(societyId?: string | null, period?: string) {
  return useQuery({
    queryKey: ['dues-admin', 'cycle-status', societyId, period],
    enabled: !!societyId && !!period,
    queryFn: async () => {
      const [{ count: flatCount, error: flatsError }, { count: duesCount, error: duesError }] = await Promise.all([
        supabase.from('flats').select('id, towers!inner(society_id)', { count: 'exact', head: true }).eq('towers.society_id', societyId!),
        supabase.from('dues').select('id', { count: 'exact', head: true }).eq('society_id', societyId!).eq('period', period!),
      ]);
      if (flatsError) throw flatsError;
      if (duesError) throw duesError;
      return { flats: flatCount ?? 0, generated: duesCount ?? 0 };
    },
  });
}

export function useGenerateDuesCycle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { dueDate: string; lineItems: DuesLineItem[]; period: string; societyId: string; total: number }) => {
      const { data, error } = await supabase.rpc('generate_dues_cycle', {
        p_due_date: input.dueDate,
        p_line_items: input.lineItems as unknown as Json,
        p_period: input.period,
        p_society: input.societyId,
        p_total: input.total,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dues-admin'] }),
  });
}

export function useDefaulters(societyId?: string | null) {
  return useQuery({
    queryKey: ['dues-admin', 'defaulters', societyId],
    enabled: !!societyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dues')
        .select('*, flats(number, towers(name))')
        .eq('society_id', societyId!)
        .in('status', ['due', 'overdue'])
        .lt('due_date', new Date().toISOString().slice(0, 10))
        .order('due_date');
      if (error) throw error;
      const flatIds = [...new Set((data ?? []).map((due) => due.flat_id))];
      const { data: residents, error: residentsError } = flatIds.length
        ? await supabase.from('flat_residents').select('flat_id, profile_id, profiles(full_name)').in('flat_id', flatIds)
        : { data: [], error: null };
      if (residentsError) throw residentsError;

      return (data ?? []).map((due) => ({
        ...due,
        flat_residents: (residents ?? []).filter((resident) => resident.flat_id === due.flat_id),
      })) as unknown as (Tables<'dues'> & {
        flat_residents?: { flat_id: string; profile_id: string; profiles?: { full_name: string } | null }[];
        flats?: { number: string; towers?: { name: string } | null } | null;
      })[];
    },
  });
}

export function useSendPaymentReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ dueId, profileId }: { dueId: string; profileId: string }) => {
      const { error } = await supabase.rpc('enqueue_notification', {
        p_body: 'Please pay your pending society dues.',
        p_category: 'payment-reminder',
        p_data: { dueId },
        p_profile_id: profileId,
        p_title: 'Dues reminder',
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dues-admin', 'defaulters'] }),
  });
}
