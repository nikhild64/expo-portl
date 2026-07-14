import type { QueryClient } from '@tanstack/react-query';

/** Query prefixes to refresh when an in-app / push notification of this category arrives. */
const NOTIFICATION_CATEGORY_QUERY_KEYS: Record<string, readonly (readonly unknown[])[]> = {
  notices: [['notices']],
  polls: [['polls']],
  'visitor-approval': [['visitors']],
  complaints: [['complaints'], ['complaint-counts']],
  payments: [['payments'], ['dues']],
};

export function invalidateQueriesForNotificationCategory(
  queryClient: QueryClient,
  category: string | null | undefined,
) {
  if (!category) return;

  const keys = NOTIFICATION_CATEGORY_QUERY_KEYS[category];
  if (!keys) return;

  for (const key of keys) {
    queryClient.invalidateQueries({ queryKey: key });
  }
}
