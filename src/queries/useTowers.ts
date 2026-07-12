import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { TablesInsert, TablesUpdate } from '@/types/database';

export function useTowers(societyId?: string | null) {
  return useQuery({
    queryKey: ['towers', societyId],
    enabled: !!societyId,
    queryFn: async () => {
      const { data, error } = await supabase.from('towers').select('*').eq('society_id', societyId!).order('sort_order').order('name');
      if (error) throw error;
      return data;
    },
  });
}

export function useTower(id?: string) {
  return useQuery({
    queryKey: ['towers', 'detail', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('towers').select('*, flats(*)').eq('id', id!).single();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertTower() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: TablesInsert<'towers'> | (TablesUpdate<'towers'> & { id: string })) => {
      const id = input.id;
      const { data, error } = id
        ? await supabase.from('towers').update(input as TablesUpdate<'towers'>).eq('id', id).select('*').single()
        : await supabase.from('towers').insert(input as TablesInsert<'towers'>).select('*').single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['towers'] }),
  });
}

export function useDeleteTower() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('towers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['towers'] }),
  });
}

export function useFlats(towerId?: string) {
  return useQuery({
    queryKey: ['flats', towerId],
    enabled: !!towerId,
    queryFn: async () => {
      const { data, error } = await supabase.from('flats').select('*').eq('tower_id', towerId!).order('floor').order('number');
      if (error) throw error;
      return data;
    },
  });
}

export function useFlat(id?: string) {
  return useQuery({
    queryKey: ['flats', 'detail', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('flats').select('*').eq('id', id!).single();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertFlat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: TablesInsert<'flats'> | (TablesUpdate<'flats'> & { id: string })) => {
      const id = input.id;
      const { data, error } = id
        ? await supabase.from('flats').update(input as TablesUpdate<'flats'>).eq('id', id).select('*').single()
        : await supabase.from('flats').insert(input as TablesInsert<'flats'>).select('*').single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['flats'] }),
  });
}

export function useBulkCreateFlats() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rows: TablesInsert<'flats'>[]) => {
      const { data, error } = await supabase.from('flats').insert(rows).select('*');
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['flats'] }),
  });
}

export function useDeleteFlat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('flats').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['flats'] }),
  });
}
