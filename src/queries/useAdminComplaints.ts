import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { TablesUpdate } from '@/types/database';

export function useAdminComplaints(societyId?: string | null) {
  return useQuery({
    queryKey: ['admin-complaints', societyId],
    enabled: !!societyId,
    queryFn: async () => {
      const { data, error } = await supabase.from('complaints').select('*').eq('society_id', societyId!).order('created_at', { ascending: false });
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
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-complaints'] });
      queryClient.invalidateQueries({ queryKey: ['complaints', 'detail', variables.id] });
    },
  });
}
