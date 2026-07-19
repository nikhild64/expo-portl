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
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database';

export type ResidentStatusFilter = Tables<'profiles'>['status'] | 'all';

export type { ResidentWithFlats };

export type PendingFlatInvite = {
  id: string;
  email: string | null;
  name: string;
  relation: string | null;
  flat_id: string | null;
  flats?: {
    id: string;
    number: string;
    tower_id: string;
    towers?: {
      id: string;
      name: string;
    } | null;
  } | null;
};

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

export function useFlatInvites(flatId?: string | null) {
  return useQuery({
    queryKey: ['admin-flat-invites', 'flat', flatId],
    enabled: !!flatId,
    queryFn: async () => {
      if (!flatId) return [];
      const { data, error } = await supabase
        .from('family_members')
        .select('id, email, name, relation, flat_id, consumed_at, flats(id, number, tower_id, towers(id, name))')
        .eq('flat_id', flatId)
        .is('consumed_at', null)
        .not('email', 'is', null)
        .order('name');
      if (error) throw error;
      return (data ?? []) as unknown as PendingFlatInvite[];
    },
  });
}

export function useSocietyInvites(societyId?: string | null) {
  return useQuery({
    queryKey: ['admin-flat-invites', 'society', societyId],
    enabled: !!societyId,
    queryFn: async () => {
      if (!societyId) return [];
      const { data, error } = await supabase
        .from('family_members')
        .select('id, email, name, relation, flat_id, consumed_at, flats!inner(id, number, tower_id, towers!inner(id, name, society_id))')
        .eq('flats.towers.society_id', societyId)
        .is('consumed_at', null)
        .not('email', 'is', null)
        .order('name');
      if (error) throw error;
      return (data ?? []) as unknown as PendingFlatInvite[];
    },
  });
}

export function useInviteToFlat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ email, flatId, name, relation }: { email: string; flatId: string; name: string; relation: string }) => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user?.id) throw new Error('Not authenticated');

      if (email.trim() && supabase.functions) {
        try {
          const { data, error } = await supabase.functions.invoke('invite-resident', {
            body: { email: email.trim(), flatId, name: name.trim() || email.trim(), relation },
          });
          if (!error && !data?.error) return;
          console.warn('Edge function invite-resident returned error or unavailable, falling back to direct DB insert:', error || data?.error);
        } catch (funcErr) {
          console.warn('Could not invoke edge function invite-resident, falling back to direct DB insert:', funcErr);
        }
      }

      const { error } = await supabase.from('family_members').insert({
        email: email.trim(),
        flat_id: flatId,
        name: name.trim() || email.trim(),
        profile_id: session.user.id,
        relation,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-flat-invites'] });
      queryClient.invalidateQueries({ queryKey: ['family-invite-check'] });
    },
  });
}

export function useRevokeFlatInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('family_members').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-flat-invites'] });
      queryClient.invalidateQueries({ queryKey: ['family-invite-check'] });
    },
  });
}

