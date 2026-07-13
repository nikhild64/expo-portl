import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export type FlatSearchResult = {
  id: string;
  number: string;
  primary_resident: string | null;
  tower_name: string;
};

type FlatSearchRow = {
  flat_residents?: {
    is_head: boolean;
    profiles?: { full_name: string; phone: string | null } | null;
  }[] | null;
  id: string;
  number: string;
  towers?: { name: string } | null;
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
      const { data, error } = await supabase
        .from('flats')
        .select('id, number, towers!inner(name), flat_residents(is_head, profiles(full_name, phone))')
        .eq('towers.society_id', societyId!)
        .order('number')
        .limit(200);

      if (error) throw error;
      const needle = debounced.toLowerCase();

      return ((data ?? []) as unknown as FlatSearchRow[])
        .map((flat) => {
          const primary =
            flat.flat_residents?.find((link) => link.is_head)?.profiles ??
            flat.flat_residents?.[0]?.profiles ??
            null;

          return {
            id: flat.id,
            number: flat.number,
            primary_resident: primary?.full_name ?? null,
            tower_name: flat.towers?.name ?? 'Tower',
            resident_phone: primary?.phone ?? null,
          };
        })
        .filter((flat) => {
          const haystack = [
            flat.number,
            flat.tower_name,
            `${flat.tower_name}-${flat.number}`,
            flat.primary_resident,
            flat.resident_phone,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          return haystack.includes(needle);
        })
        .slice(0, 20)
        .map(({ resident_phone: _residentPhone, ...flat }) => flat);
    },
  });
}
