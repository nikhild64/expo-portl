import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { TablesInsert } from '@/types/database';

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
        .select('*, assigned:profiles!complaints_assigned_to_fkey(full_name, phone, avatar_url, role)')
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
