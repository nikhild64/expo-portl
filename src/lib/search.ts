import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';

import { useDebouncedValue } from '@/hooks/useDebouncedValue';

export function escapeIlike(value: string) {
  return value.replace(/[%_\\]/g, (char) => `\\${char}`);
}

type DebouncedSearchQueryOptions<TData> = Omit<
  UseQueryOptions<TData, Error, TData, readonly unknown[]>,
  'queryKey' | 'queryFn'
> & {
  query: string;
  queryKeyPrefix: readonly string[];
  minLength?: number;
  debounceMs?: number;
  queryFn: (debounced: string) => Promise<TData>;
};

export function createDebouncedSearchQuery<TData>(
  options: DebouncedSearchQueryOptions<TData>,
): UseQueryResult<TData, Error> {
  const { query, queryKeyPrefix, minLength = 1, debounceMs = 300, queryFn, enabled, ...rest } = options;
  const debounced = useDebouncedValue(query.trim(), debounceMs);

  return useQuery({
    queryKey: [...queryKeyPrefix, debounced],
    enabled: (enabled ?? true) && debounced.length >= minLength,
    queryFn: () => queryFn(debounced),
    ...rest,
  });
}
