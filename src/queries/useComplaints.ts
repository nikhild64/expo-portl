import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { Tables, TablesInsert } from '@/types/database';

type Complaint = Tables<'complaints'>;

export function useComplaints(filter: 'active' | 'resolved' | 'all' = 'active') {
  const uid = useAuthStore((s) => s.session?.user.id);

  return useQuery({
    queryKey: ['complaints', filter, uid],
    enabled: !!uid,
    queryFn: async () => {
      let query = supabase.from('complaints').select('*').eq('raised_by', uid!);
      if (filter === 'active') query = query.in('status', ['new', 'assigned', 'in_progress']);
      if (filter === 'resolved') query = query.in('status', ['resolved', 'closed']);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useComplaint(id?: string) {
  return useQuery({
    queryKey: ['complaints', 'detail', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('complaints')
        .select('*, assigned:profiles!complaints_assigned_to_fkey(full_name, phone, avatar_url, role), assigned_service_provider:service_providers!complaints_assigned_service_provider_id_fkey(name, phone, category)')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useComplaintUpdates(complaintId?: string) {
  return useQuery({
    queryKey: ['complaint-updates', complaintId],
    enabled: !!complaintId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('complaint_updates')
        .select('*')
        .eq('complaint_id', complaintId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateComplaint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TablesInsert<'complaints'>) => {
      const { data, error } = await supabase.from('complaints').insert(input).select('*').single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['complaints'] }),
  });
}

export function useAddComplaintComment(complaintId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: string) => {
      const uid = useAuthStore.getState().session?.user.id;
      if (!uid) throw new Error('Sign in required');

      const { error } = await supabase.from('complaint_updates').insert({
        body,
        complaint_id: complaintId,
        kind: 'comment',
        profile_id: uid,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['complaint-updates', complaintId] }),
  });
}

export function useCloseComplaint() {
  const queryClient = useQueryClient();
  const closedAt = () => new Date().toISOString();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('complaints')
        .update({ resolved_at: closedAt(), status: 'closed' })
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['complaints'] });
      await queryClient.cancelQueries({ queryKey: ['complaints', 'detail', id] });

      const previousLists = queryClient.getQueriesData<Complaint[]>({ queryKey: ['complaints'] });
      const previousDetail = queryClient.getQueryData<Complaint>(['complaints', 'detail', id]);

      const patch = { resolved_at: closedAt(), status: 'closed' as const };
      queryClient.setQueriesData<Complaint[]>({ queryKey: ['complaints'] }, (old) =>
        old?.map((complaint) => (complaint.id === id ? { ...complaint, ...patch } : complaint)),
      );
      queryClient.setQueryData<Complaint>(['complaints', 'detail', id], (old) => (old ? { ...old, ...patch } : old));

      return { previousLists, previousDetail };
    },
    onError: (_error, id, context) => {
      context?.previousLists.forEach(([key, data]) => queryClient.setQueryData(key, data));
      if (context?.previousDetail) {
        queryClient.setQueryData(['complaints', 'detail', id], context.previousDetail);
      }
    },
    onSettled: (_data, _error, id) => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      queryClient.invalidateQueries({ queryKey: ['complaints', 'detail', id] });
    },
  });
}
