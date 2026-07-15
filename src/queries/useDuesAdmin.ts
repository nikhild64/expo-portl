import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { DuesLineItem } from '@/features/payments/lineItems';
import { lineItemsToJson, parseLineItems } from '@/features/payments/lineItems';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

export type { DuesLineItem };

type DefaulterRow = Tables<'dues'> & {
  flat_residents?: { flat_id: string; profile_id: string; profiles?: { full_name: string } | null }[];
  flats?: { number: string; towers?: { name: string } | null } | null;
};

export function useDuesCycleStatus(societyId?: string | null, period?: string) {
  return useQuery({
    queryKey: ['dues-admin', 'cycle-status', societyId, period],
    enabled: !!societyId && !!period,
    queryFn: async () => {
      if (!societyId || !period) return { flats: 0, generated: 0 };

      const [{ data: occupiedCount, error: occupiedError }, { count: duesCount, error: duesError }] = await Promise.all([
        supabase.rpc('count_society_occupied_flats', { p_society: societyId }),
        supabase.from('dues').select('id', { count: 'exact', head: true }).eq('society_id', societyId).eq('period', period),
      ]);
      if (occupiedError) throw occupiedError;
      if (duesError) throw duesError;
      return { flats: occupiedCount ?? 0, generated: duesCount ?? 0 };
    },
  });
}

export function useLastDuesCycleTemplate(societyId?: string | null) {
  return useQuery({
    queryKey: ['dues-admin', 'last-template', societyId],
    enabled: !!societyId,
    queryFn: async () => {
      if (!societyId) return null;

      const { data, error } = await supabase
        .from('dues')
        .select('line_items, total')
        .eq('society_id', societyId)
        .order('period', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;

      const lineItems = parseLineItems(data.line_items);
      if (!lineItems.length) return null;

      return { lineItems, total: Number(data.total) };
    },
  });
}

export function useGenerateDuesCycle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { dueDate: string; lineItems: DuesLineItem[]; period: string; societyId: string; total: number }) => {
      const { data, error } = await supabase.rpc('generate_dues_cycle', {
        p_due_date: input.dueDate,
        p_line_items: lineItemsToJson(input.lineItems),
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
      if (!societyId) return [];

      const { data, error } = await supabase
        .from('dues')
        .select('*, flats(number, towers(name))')
        .eq('society_id', societyId)
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
      })) as DefaulterRow[];
    },
  });
}

async function queuePaymentReminder(dueId: string, profileId: string) {
  const { error } = await supabase.rpc('enqueue_notification', {
    p_body: 'Please pay your pending society dues.',
    p_category: 'payment-reminder',
    p_data: {
      dueId,
      template: 'paymentReminder',
      params: {},
      url: '/(resident)/(payments)',
    },
    p_profile_id: profileId,
    p_title: 'Dues reminder',
  });
  if (error) throw error;
}

export function useSendPaymentReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ dueId, profileId }: { dueId: string; profileId: string }) => queuePaymentReminder(dueId, profileId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dues-admin', 'defaulters'] }),
  });
}

export function useSendAllPaymentReminders() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (targets: { dueId: string; profileId: string }[]) => {
      for (const target of targets) {
        await queuePaymentReminder(target.dueId, target.profileId);
      }
      return targets.length;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dues-admin', 'defaulters'] }),
  });
}
