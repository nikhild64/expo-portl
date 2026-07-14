import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { TablesUpdate } from '@/types/database';

export function useSociety(id?: string | null) {
  return useQuery({
    queryKey: ['society', id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) throw new Error('Society id required');

      const { data, error } = await supabase.from('societies').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateSociety() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: TablesUpdate<'societies'> }) => {
      const { data, error } = await supabase.from('societies').update(patch).eq('id', id).select('*').single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => queryClient.invalidateQueries({ queryKey: ['society', variables.id] }),
  });
}
