import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { supabase } from '@/lib/supabase';
import {
  residentDetailSelect,
  residentListByTowerSelect,
  residentListSelect,
  type ResidentDetail,
  type ResidentWithFlats,
  type ResidentWithFlatsByTower,
} from '@/queries/supabaseSelects';
import type { Tables, TablesUpdate } from '@/types/database';

export type ResidentStatusFilter = Tables<'profiles'>['status'] | 'all';

export type { ResidentWithFlats };

export function useAdminResidents(societyId?: string | null, filters: { status?: ResidentStatusFilter; towerId?: string; search?: string } = {}) {
  const debouncedSearch = useDebouncedValue(filters.search?.trim() ?? '');

  return useQuery({
    queryKey: ['admin-residents', societyId, filters.status, filters.towerId, debouncedSearch],
    enabled: !!societyId,
    queryFn: async () => {
      if (!societyId) return [];

      const towerFilter = filters.towerId && filters.towerId !== 'all' ? filters.towerId : null;
      let query = (towerFilter ? residentListByTowerSelect() : residentListSelect())
        .eq('society_id', societyId)
        .eq('role', 'resident')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status);
      if (debouncedSearch) query = query.ilike('full_name', `%${debouncedSearch}%`);
      if (towerFilter) query = query.eq('flat_residents.flats.tower_id', towerFilter);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as ResidentWithFlats[] | ResidentWithFlatsByTower[];
    },
  });
}

export function useResidentDetail(id?: string) {
  return useQuery({
    queryKey: ['admin-residents', 'detail', id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) throw new Error('Resident id required');

      const { data, error } = await residentDetailSelect(id);
      if (error) throw error;
      return data as ResidentDetail;
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
