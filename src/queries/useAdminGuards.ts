import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { supabase } from '@/lib/supabase';
import type { Tables, TablesUpdate } from '@/types/database';

export type GuardStatusFilter = Tables<'profiles'>['status'] | 'all';
export type GuardProfile = Tables<'profiles'>;

export function useAdminGuards(
  societyId?: string | null,
  filters: { status?: GuardStatusFilter; search?: string } = {},
) {
  const debouncedSearch = useDebouncedValue(filters.search?.trim() ?? '');

  return useQuery({
    queryKey: ['admin-guards', societyId, filters.status, debouncedSearch],
    enabled: !!societyId,
    queryFn: async () => {
      if (!societyId) return [];

      let query = supabase
        .from('profiles')
        .select('*')
        .eq('society_id', societyId)
        .eq('role', 'guard')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status);
      if (debouncedSearch) query = query.ilike('full_name', `%${debouncedSearch}%`);

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useGuardDetail(id?: string) {
  return useQuery({
    queryKey: ['admin-guards', 'detail', id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) throw new Error('Guard id required');

      const { data, error } = await supabase.from('profiles').select('*').eq('id', id).eq('role', 'guard').single();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateGuard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: TablesUpdate<'profiles'> }) => {
      const { data, error } = await supabase.from('profiles').update(patch).eq('id', id).select('*').single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-guards'] });
      queryClient.invalidateQueries({ queryKey: ['admin-guards', 'detail', variables.id] });
    },
  });
}
