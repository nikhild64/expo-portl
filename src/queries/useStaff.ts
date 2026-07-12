import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { TablesInsert, TablesUpdate } from '@/types/database';

export function useStaff(societyId?: string | null, role?: string) {
  return useQuery({
    queryKey: ['staff', societyId, role],
    enabled: !!societyId,
    queryFn: async () => {
      let query = supabase.from('staff').select('*').eq('society_id', societyId!);
      if (role && role !== 'all') query = query.eq('role', role);
      const { data, error } = await query.order('active', { ascending: false }).order('name');
      if (error) throw error;
      return data;
    },
  });
}

export function useStaffMember(id?: string) {
  return useQuery({
    queryKey: ['staff', 'detail', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('staff').select('*').eq('id', id!).single();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: TablesInsert<'staff'> | (TablesUpdate<'staff'> & { id: string })) => {
      const id = input.id;
      const { data, error } = id
        ? await supabase.from('staff').update(input as TablesUpdate<'staff'>).eq('id', id).select('*').single()
        : await supabase.from('staff').insert(input as TablesInsert<'staff'>).select('*').single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff'] }),
  });
}

export function useDeleteStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('staff').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff'] }),
  });
}
