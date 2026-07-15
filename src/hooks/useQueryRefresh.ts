import { useCallback, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useQueryRefresh(queryKeys: readonly (readonly string[])[]) {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const keysRef = useRef(queryKeys);
  keysRef.current = queryKeys;

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all(keysRef.current.map((key) => queryClient.refetchQueries({ queryKey: key })));
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  return { refreshing, refresh };
}
