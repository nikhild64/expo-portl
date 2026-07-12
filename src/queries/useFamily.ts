import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { TablesInsert } from '@/types/database';

export function useFamily() {
  const uid = useAuthStore((s) => s.session?.user.id);

  return useQuery({
    queryKey: ['family', uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.from('family_members').select('*').eq('profile_id', uid!).order('name');
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateFamilyMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TablesInsert<'family_members'>) => {
      const { error } = await supabase.from('family_members').insert(input);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['family'] }),
  });
}

export function useDeleteFamilyMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('family_members').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['family'] }),
  });
}
