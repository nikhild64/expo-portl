import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export type FlatSearchResult = {
  id: string;
  number: string;
  primary_resident: string | null;
  tower_name: string;
};

function useDebouncedValue(value: string, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [delay, value]);

  return debounced;
}

export function useFlatSearch(societyId: string | null | undefined, query: string) {
  const debounced = useDebouncedValue(query.trim());

  return useQuery({
    queryKey: ['flat-search', societyId, debounced],
    enabled: !!societyId && debounced.length >= 1,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('search_flats', {
        p_query: debounced,
        p_society: societyId!,
      });

      if (error) throw error;
      return (data ?? []) as FlatSearchResult[];
    },
  });
}
