import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

function useDebouncedValue(value: string, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [delay, value]);

  return debounced;
}

export function useSocietySearch(query: string) {
  const debounced = useDebouncedValue(query.trim());

  return useQuery({
    queryKey: ['society-search', debounced],
    enabled: debounced.length >= 2,
    queryFn: async () => {
      const escaped = debounced.replace(/[%_]/g, (char) => `\\${char}`);
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
