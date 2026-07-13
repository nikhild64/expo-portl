import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useFlatsByTower(towerId: string | null | undefined) {
  return useQuery({
    queryKey: ['flats', towerId],
    enabled: !!towerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flats')
        .select('*')
        .eq('tower_id', towerId!)
        .order('number', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}
