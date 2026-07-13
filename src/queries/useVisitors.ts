import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { Tables, TablesInsert } from '@/types/database';

type Visitor = Tables<'visitors'>;
type PreApproval = Tables<'pre_approvals'>;
type VisitorStatus = Visitor['status'];

export function useVisitorsList(flatIds: string[] | undefined, filter: 'pending' | 'history') {
  return useQuery({
    queryKey: ['visitors', filter, flatIds],
    enabled: !!flatIds?.length,
    queryFn: async () => {
      let query = supabase.from('visitors').select('*').in('flat_id', flatIds!);

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

export function usePreApprovalsList(flatIds: string[] | undefined) {
  return useQuery({
    queryKey: ['pre-approvals', flatIds],
    enabled: !!flatIds?.length,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pre_approvals')
        .select('*')
        .in('flat_id', flatIds!)
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
      const { data, error } = await supabase.from('visitors').select('*').eq('id', id!).single();
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
      const { data, error } = await supabase.from('pre_approvals').select('*').eq('id', id!).single();
      if (error) throw error;
      return data;
    },
  });
}

function useVisitorDecision(status: Extract<VisitorStatus, 'approved' | 'rejected'>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, instructions }: { id: string; instructions?: string }) => {
      const myId = useAuthStore.getState().session?.user.id;
      const { error } = await supabase
        .from('visitors')
        .update({
          decided_at: new Date().toISOString(),
          decided_by: myId ?? null,
          resident_instructions: instructions ?? null,
          status,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ['visitors'] });
      const previous = queryClient.getQueriesData<Visitor[]>({ queryKey: ['visitors'] });

      queryClient.setQueriesData<Visitor[]>({ queryKey: ['visitors'] }, (old) =>
        old?.map((visitor) => (visitor.id === id ? { ...visitor, status } : visitor)),
      );
      queryClient.setQueryData<Visitor>(['visitors', 'detail', id], (old) =>
        old ? { ...old, status, decided_at: new Date().toISOString() } : old,
      );

      return { previous };
    },
    onError: (_error, _variables, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSuccess: () => {
      void Haptics.notificationAsync(
        status === 'approved'
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning,
      );
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      queryClient.invalidateQueries({ queryKey: ['visitors', 'detail', variables.id] });
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
