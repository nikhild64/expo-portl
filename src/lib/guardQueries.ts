import type { QueryClient } from '@tanstack/react-query';

export async function invalidateGuardActivity(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['guard-stats'] }),
    queryClient.invalidateQueries({ queryKey: ['guard-activity'] }),
    queryClient.invalidateQueries({ queryKey: ['visitor-log'] }),
  ]);
}
