import { QueryClient } from '@tanstack/react-query';

import { invalidateGuardActivity } from './guardQueries';

describe('invalidateGuardActivity', () => {
  it('invalidates guard stats, activity, and visitor log queries', async () => {
    const queryClient = new QueryClient();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    await invalidateGuardActivity(queryClient);

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['guard-stats'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['guard-activity'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['visitor-log'] });
  });
});
