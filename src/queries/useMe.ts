import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

export function useMyFlatIds() {
  const uid = useAuthStore((s) => s.session?.user.id);

  return useQuery({
    queryKey: ['me', 'flat-ids', uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flat_residents')
        .select('flat_id')
        .eq('profile_id', uid!);

      if (error) throw error;
      return data.map((row) => row.flat_id);
    },
  });
}

export function useMyPrimaryFlat() {
  const uid = useAuthStore((s) => s.session?.user.id);

  return useQuery({
    queryKey: ['me', 'primary-flat', uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flat_residents')
        .select('flat_id, is_head, is_owner, flats(id, number, tower_id, towers(id, name, society_id))')
        .eq('profile_id', uid!)
        .order('is_head', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
}
