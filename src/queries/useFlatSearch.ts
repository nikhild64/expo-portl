import { escapeIlike, useDebouncedSearchQuery } from '@/lib/search';
import { flatSearchSelect, type FlatSearchRow } from '@/queries/supabaseSelects';

export type FlatSearchResult = {
  id: string;
  number: string;
  primary_resident: string | null;
  tower_name: string;
};

function mapFlatSearchRow(flat: FlatSearchRow): FlatSearchResult {
  const primary =
    flat.flat_residents?.find((link) => link.is_head)?.profiles ?? flat.flat_residents?.[0]?.profiles ?? null;

  return {
    id: flat.id,
    number: flat.number,
    primary_resident: primary?.full_name ?? null,
    tower_name: flat.towers?.name ?? 'Tower',
  };
}

export function useFlatSearch(societyId: string | null | undefined, query: string) {
  return useDebouncedSearchQuery({
    query,
    queryKeyPrefix: ['flat-search', societyId ?? ''],
    enabled: !!societyId,
    queryFn: async (debounced) => {
      if (!societyId) return [];

      const escaped = escapeIlike(debounced);
      const { data, error } = await flatSearchSelect()
        .eq('towers.society_id', societyId)
        .ilike('number', `%${escaped}%`)
        .order('number')
        .limit(20);

      if (error) throw error;

      return (data ?? []).map(mapFlatSearchRow);
    },
  });
}
