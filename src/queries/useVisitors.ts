import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';

import { supabase } from '@/lib/supabase';
import { invalidateGuardActivity } from '@/lib/guardQueries';
import { enqueueIfOffline } from '@/lib/offlineQueue';
import { visitorDetailSelect, type VisitorDetail } from '@/queries/supabaseSelects';
import { useAuthStore } from '@/stores/authStore';
import type { Tables, TablesInsert } from '@/types/database';

type Visitor = Tables<'visitors'>;
type PreApproval = Tables<'pre_approvals'>;
type VisitorStatus = Visitor['status'];

export type { VisitorDetail };

export function useVisitorsList(flatIds: string[] | undefined, filter: 'pending' | 'history', options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['visitors', filter, flatIds],
    enabled: (options?.enabled ?? true) && !!flatIds?.length,
    queryFn: async () => {
      if (!flatIds?.length) return [];

      let query = supabase.from('visitors').select('*').in('flat_id', flatIds);

      if (filter === 'pending') {
        query = query.eq('status', 'pending');
      } else {
        query = query.in('status', ['approved', 'entered', 'exited', 'rejected', 'expired']);
      }

      const { data, error } = await query.order('requested_at', { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
  });
}

export function usePreApprovalsList(flatIds: string[] | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['pre-approvals', flatIds],
    enabled: (options?.enabled ?? true) && !!flatIds?.length,
    queryFn: async () => {
      if (!flatIds?.length) return [];

      const { data, error } = await supabase
        .from('pre_approvals')
        .select('*')
        .in('flat_id', flatIds)
        .gte('end_at', new Date().toISOString())
        .order('start_at', { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}

export function useVisitor(id?: string) {
  return useQuery({
    queryKey: ['visitors', 'detail', id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) throw new Error('Visitor id required');

      const { data, error } = await visitorDetailSelect(id);
      if (error) throw error;
      return data;
    },
  });
}

export function usePreApproval(id?: string) {
  return useQuery({
    queryKey: ['pre-approvals', 'detail', id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) throw new Error('Pre-approval id required');

      const { data, error } = await supabase.from('pre_approvals').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
  });
}

function useVisitorDecision(status: Extract<VisitorStatus, 'approved' | 'rejected'>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, instructions }: { id: string; instructions?: string }) => {
      const queueType = status === 'approved' ? 'approve_visitor' : 'reject_visitor';
      const queued = await enqueueIfOffline(
        queueType === 'approve_visitor'
          ? { type: queueType, payload: { visitorId: id, instructions: instructions ?? null } }
          : { type: queueType, payload: { visitorId: id } },
      );
      if (queued) return;

      const myId = useAuthStore.getState().session?.user.id;
      const { data, error } = await supabase
        .from('visitors')
        .update({
          decided_at: new Date().toISOString(),
          decided_by: myId ?? null,
          resident_instructions: instructions ?? null,
          status,
        })
        .eq('id', id)
        .select('status')
        .single();

      if (error) throw error;
      if (data.status !== status) {
        throw new Error('Your decision did not save. Please try again.');
      }
    },
    onMutate: async ({ id, instructions }) => {
      await queryClient.cancelQueries({ queryKey: ['visitors'] });
      const previous = queryClient.getQueriesData({ queryKey: ['visitors'] });

      const decidedAt = new Date().toISOString();
      const myId = useAuthStore.getState().session?.user.id;
      const detail = queryClient.getQueryData<Visitor>(['visitors', 'detail', id]);
      let source = detail;

      if (!source) {
        for (const [, data] of queryClient.getQueriesData<Visitor[]>({ queryKey: ['visitors', 'pending'] })) {
          const found = data?.find((visitor) => visitor.id === id);
          if (found) {
            source = found;
            break;
          }
        }
      }

      const decided: Partial<Visitor> = {
        status,
        decided_at: decidedAt,
        decided_by: myId ?? null,
        resident_instructions: instructions ?? source?.resident_instructions ?? null,
      };

      queryClient.setQueriesData<Visitor[]>({ queryKey: ['visitors', 'pending'] }, (old) =>
        Array.isArray(old) ? old.filter((visitor) => visitor.id !== id) : old,
      );

      if (source) {
        const updated = { ...source, ...decided };
        queryClient.setQueriesData<Visitor[]>({ queryKey: ['visitors', 'history'] }, (old) => {
          if (!Array.isArray(old)) return old;
          return [updated, ...old.filter((visitor) => visitor.id !== id)];
        });
      }

      queryClient.setQueryData<Visitor>(['visitors', 'detail', id], (old) => (old ? { ...old, ...decided } : old));

      return { previous };
    },
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['visitors', 'detail', id] });
      void invalidateGuardActivity(queryClient);
      if (status === 'rejected') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    },
    onError: (_error, _variables, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
    },
  });
}

export function useApproveVisitor() {
  return useVisitorDecision('approved');
}

export function useRejectVisitor() {
  return useVisitorDecision('rejected');
}

export function useCreatePreApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TablesInsert<'pre_approvals'>) => {
      const { data, error } = await supabase.from('pre_approvals').insert(input).select('*').single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pre-approvals'] });
      queryClient.setQueryData<PreApproval>(['pre-approvals', 'detail', data.id], data);
    },
  });
}

export function useRevokePreApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pre_approvals').delete().eq('id', id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['pre-approvals'] });
      const previous = queryClient.getQueriesData({ queryKey: ['pre-approvals'] });

      const remove = (old: PreApproval[] | undefined) =>
        Array.isArray(old) ? old.filter((item) => item.id !== id) : old;

      queryClient.setQueriesData<PreApproval[]>({ queryKey: ['pre-approvals'] }, remove);
      queryClient.setQueryData<PreApproval | undefined>(['pre-approvals', 'detail', id], undefined);

      return { previous };
    },
    onError: (_error, _id, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
      queryClient.invalidateQueries({ queryKey: ['pre-approvals'] });
    },
    onSuccess: () => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });
}
