import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { TablesInsert } from '@/types/database';

export function useVehicles(flatIds: string[] | undefined) {
  return useQuery({
    queryKey: ['vehicles', flatIds],
    enabled: !!flatIds?.length,
    queryFn: async () => {
      const { data, error } = await supabase.from('vehicles').select('*').in('flat_id', flatIds!).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TablesInsert<'vehicles'>) => {
      const { error } = await supabase.from('vehicles').insert(input);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vehicles'] }),
  });
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('vehicles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vehicles'] }),
  });
}
