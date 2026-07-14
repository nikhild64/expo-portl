import { createDebouncedSearchQuery, escapeIlike } from '@/lib/search';
import { supabase } from '@/lib/supabase';

export function useSocietySearch(query: string) {
  return createDebouncedSearchQuery({
    query,
    queryKeyPrefix: ['society-search'],
    minLength: 2,
    queryFn: async (debounced) => {
      const escaped = escapeIlike(debounced);
      const { data, error } = await supabase
        .from('societies')
        .select('*')
        .or(`name.ilike.%${escaped}%,city.ilike.%${escaped}%`)
        .order('name')
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });
}
