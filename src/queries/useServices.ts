import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { TablesInsert, TablesUpdate } from '@/types/database';

export function useServices(societyId?: string | null, category?: string) {
  return useQuery({
    queryKey: ['services', societyId, category],
    enabled: !!societyId,
    queryFn: async () => {
      if (!societyId) return [];

      let query = supabase.from('service_providers').select('*').eq('society_id', societyId);
      if (category && category !== 'all') query = query.eq('category', category);
      const { data, error } = await query.order('verified', { ascending: false }).order('name');
      if (error) throw error;
      return data;
    },
  });
}

export function useServiceProvider(id?: string) {
  return useQuery({
    queryKey: ['services', 'detail', id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) throw new Error('Service provider id required');

      const { data, error } = await supabase.from('service_providers').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: TablesInsert<'service_providers'> | (TablesUpdate<'service_providers'> & { id: string })) => {
      const id = input.id;
      const { data, error } = id
        ? await supabase.from('service_providers').update(input as TablesUpdate<'service_providers'>).eq('id', id).select('*').single()
        : await supabase.from('service_providers').insert(input as TablesInsert<'service_providers'>).select('*').single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] }),
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('service_providers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] }),
  });
}
