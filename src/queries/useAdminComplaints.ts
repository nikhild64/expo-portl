import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { Tables, TablesUpdate } from '@/types/database';

type Complaint = Tables<'complaints'>;

export function useAdminComplaints(societyId?: string | null) {
  return useQuery({
    queryKey: ['admin-complaints', societyId],
    enabled: !!societyId,
    queryFn: async () => {
      if (!societyId) return [];

      const { data, error } = await supabase.from('complaints').select('*').eq('society_id', societyId).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateComplaintAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: TablesUpdate<'complaints'> }) => {
      const { data, error } = await supabase.from('complaints').update(patch).eq('id', id).select('*').single();
      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: ['admin-complaints'] });
      await queryClient.cancelQueries({ queryKey: ['complaints', 'detail', id] });

      const previousAdmin = queryClient.getQueriesData<Complaint[]>({ queryKey: ['admin-complaints'] });
      const previousDetail = queryClient.getQueriesData<unknown>({ queryKey: ['complaints', 'detail', id] });

      queryClient.setQueriesData<Complaint[]>({ queryKey: ['admin-complaints'] }, (old) =>
        old?.map((complaint) => (complaint.id === id ? { ...complaint, ...patch } : complaint)),
      );
      queryClient.setQueriesData<unknown>({ queryKey: ['complaints', 'detail', id] }, (old: unknown) =>
        old && typeof old === 'object' ? { ...old, ...patch } : old,
      );

      return { previousAdmin, previousDetail };
    },
    onError: (_error, _variables, context) => {
      context?.previousAdmin.forEach(([key, data]) => queryClient.setQueryData(key, data));
      context?.previousDetail.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-complaints'] });
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      queryClient.invalidateQueries({ queryKey: ['complaint-counts'] });
      queryClient.invalidateQueries({ queryKey: ['complaints', 'detail', variables.id] });
    },
  });
}
