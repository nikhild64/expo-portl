import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useTowersBySociety(societyId: string | null | undefined) {
  return useQuery({
    queryKey: ['towers', societyId],
    enabled: !!societyId,
    queryFn: async () => {
      if (!societyId) return [];

      const { data, error } = await supabase
        .from('towers')
        .select('*')
        .eq('society_id', societyId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}
