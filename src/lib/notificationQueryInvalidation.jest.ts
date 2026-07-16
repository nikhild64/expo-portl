import { QueryClient } from '@tanstack/react-query';

import { invalidateQueriesForNotificationCategory } from './notificationQueryInvalidation';

describe('invalidateQueriesForNotificationCategory', () => {
  it('invalidates the mapped query keys for known categories', () => {
    const queryClient = new QueryClient();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    invalidateQueriesForNotificationCategory(queryClient, 'complaints');

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['complaints'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['complaint-counts'] });
  });

  it('no-ops for missing or unknown categories', () => {
    const queryClient = new QueryClient();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    invalidateQueriesForNotificationCategory(queryClient, null);
    invalidateQueriesForNotificationCategory(queryClient, 'unknown');

    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
