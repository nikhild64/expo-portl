import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export function usePendingApprovals(societyId?: string | null) {
  return useQuery({
    queryKey: ['pending-approvals', societyId],
    enabled: !!societyId,
    queryFn: async () => {
      if (!societyId) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('*, flat_residents(flat_id,is_head,is_owner, flats(id,number,tower_id, towers(id,name)))')
        .eq('society_id', societyId)
        .in('role', ['resident', 'guard'])
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useApproveResident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profileId: string) => {
      const { error } = await supabase.from('profiles').update({ status: 'active' }).eq('id', profileId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['admin-residents'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
  });
}

export function useRejectResident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profileId: string) => {
      const { error: linkError } = await supabase.from('flat_residents').delete().eq('profile_id', profileId);
      if (linkError) throw linkError;
      const { error } = await supabase.from('profiles').update({ status: 'blocked' }).eq('id', profileId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['admin-residents'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
  });
}
