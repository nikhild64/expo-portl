import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { Tables, TablesUpdate } from '@/types/database';

export type ResidentStatusFilter = Tables<'profiles'>['status'] | 'all';

export type ResidentWithFlats = Tables<'profiles'> & {
  flat_residents?: {
    flat_id: string;
    is_head: boolean;
    is_owner: boolean;
    flats?: { id: string; number: string; tower_id: string; towers?: { id: string; name: string } | null } | null;
  }[];
};

export function useAdminResidents(societyId?: string | null, filters: { status?: ResidentStatusFilter; towerId?: string; search?: string } = {}) {
  return useQuery({
    queryKey: ['admin-residents', societyId, filters],
    enabled: !!societyId,
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*, flat_residents(flat_id,is_head,is_owner, flats(id,number,tower_id, towers(id,name)))')
        .eq('society_id', societyId!)
        .eq('role', 'resident');

      if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status);
      if (filters.search?.trim()) query = query.ilike('full_name', `%${filters.search.trim()}%`);

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;

      const residents = (data ?? []) as ResidentWithFlats[];
      if (!filters.towerId || filters.towerId === 'all') return residents;
      return residents.filter((resident) => resident.flat_residents?.some((link) => link.flats?.tower_id === filters.towerId));
    },
  });
}

export function useResidentDetail(id?: string) {
  return useQuery({
    queryKey: ['admin-residents', 'detail', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, flat_residents(flat_id,is_head,is_owner, flats(id,number,tower_id, towers(id,name)))')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as unknown as ResidentWithFlats;
    },
  });
}

export function useUpdateResident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: TablesUpdate<'profiles'> }) => {
      const { data, error } = await supabase.from('profiles').update(patch).eq('id', id).select('*').single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-residents'] });
      queryClient.invalidateQueries({ queryKey: ['admin-residents', 'detail', variables.id] });
    },
  });
}

export function useAssignResidentFlat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ profileId, flatId, isHead = false, isOwner = false }: { profileId: string; flatId: string; isHead?: boolean; isOwner?: boolean }) => {
      const { error } = await supabase.from('flat_residents').upsert({
        flat_id: flatId,
        is_head: isHead,
        is_owner: isOwner,
        profile_id: profileId,
      });
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-residents'] });
      queryClient.invalidateQueries({ queryKey: ['admin-residents', 'detail', variables.profileId] });
    },
  });
}

export function useRemoveResidentFlat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ profileId, flatId }: { profileId: string; flatId: string }) => {
      const { error } = await supabase.from('flat_residents').delete().eq('profile_id', profileId).eq('flat_id', flatId);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-residents'] });
      queryClient.invalidateQueries({ queryKey: ['admin-residents', 'detail', variables.profileId] });
    },
  });
}
