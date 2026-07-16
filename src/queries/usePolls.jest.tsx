import { act, renderHook, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { usePolls, useVotePoll, usePoll, usePollVotes, useMyPollVote, usePollComments, useAddPollComment } from './usePolls';
import { createMutationWrapper, createQueryWrapper, createSelectChain } from './__testUtils/queryTestUtils';

const mockFrom = jest.fn();
const mockUseAuthStore = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: { from: (table: string) => mockFrom(table) },
}));

jest.mock('@/stores/authStore', () => ({
  useAuthStore: Object.assign(
    (selector: (state: unknown) => unknown) => mockUseAuthStore(selector),
    {
      getState: () =>
        mockUseAuthStore((state) => state) as { session: { user: { id: string } } | null },
    },
  ),
}));

const authState = { session: { user: { id: 'user-1' } } };
const societyId = 'soc-1';

function createPollSelectChain<T>(result: { data: T; error: null } | { data: null; error: { message: string } }) {
  const chain = createSelectChain(result) as ReturnType<typeof createSelectChain> & {
    gte: jest.Mock;
    lte: jest.Mock;
    lt: jest.Mock;
  };
  chain.gte = jest.fn().mockReturnValue(chain);
  chain.lte = jest.fn().mockReturnValue(chain);
  chain.lt = jest.fn().mockReturnValue(chain);
  return chain;
}

describe('usePolls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockImplementation((selector) => selector(authState));
  });

  it('does not fetch when societyId is missing', () => {
    const { result } = renderHook(() => usePolls(null), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('loads active polls within the current window', async () => {
    const polls = [{ id: 'poll-1', question: 'Repaint lobby?', society_id: societyId }];
    const chain = createPollSelectChain({ data: polls, error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => usePolls(societyId, 'active'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('polls');
    expect(chain.eq).toHaveBeenCalledWith('society_id', societyId);
    expect(chain.lte).toHaveBeenCalledWith('starts_at', expect.any(String));
    expect(chain.gte).toHaveBeenCalledWith('ends_at', expect.any(String));
    expect(chain.order).toHaveBeenCalledWith('ends_at', { ascending: true });
    expect(result.current.data).toEqual(polls);
  });

  it('loads closed polls that ended before now', async () => {
    const chain = createPollSelectChain({ data: [], error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => usePolls(societyId, 'closed'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(chain.lt).toHaveBeenCalledWith('ends_at', expect.any(String));
    expect(chain.lte).not.toHaveBeenCalled();
    expect(chain.order).toHaveBeenCalledWith('ends_at', { ascending: false });
  });
});

describe('usePoll detail and votes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockImplementation((selector) => selector(authState));
  });

  it('loads a poll by id', async () => {
    const poll = { id: 'poll-1', question: 'Repaint lobby?' };
    const chain = createPollSelectChain({ data: poll, error: null });
    chain.single = jest.fn().mockResolvedValue({ data: poll, error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => usePoll('poll-1'), { wrapper: createQueryWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(poll);
  });

  it('loads votes for a poll', async () => {
    const votes = [{ poll_id: 'poll-1', profile_id: 'user-1', option_indices: [0] }];
    const chain = createPollSelectChain({ data: votes, error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => usePollVotes('poll-1'), { wrapper: createQueryWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(chain.eq).toHaveBeenCalledWith('poll_id', 'poll-1');
    expect(result.current.data).toEqual(votes);
  });

  it('loads the signed-in user vote', async () => {
    const vote = { poll_id: 'poll-1', profile_id: 'user-1', option_indices: [1] };
    const chain = createPollSelectChain({ data: vote, error: null });
    chain.maybeSingle = jest.fn().mockResolvedValue({ data: vote, error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useMyPollVote('poll-1'), { wrapper: createQueryWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(chain.eq).toHaveBeenCalledWith('profile_id', 'user-1');
    expect(result.current.data).toEqual(vote);
  });

  it('loads poll comments in chronological order', async () => {
    const comments = [{ id: 'c-1', body: 'Yes please' }];
    const chain = createPollSelectChain({ data: comments, error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => usePollComments('poll-1'), { wrapper: createQueryWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFrom).toHaveBeenCalledWith('poll_comments');
    expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: true });
    expect(result.current.data).toEqual(comments);
  });

  it('adds a poll comment and invalidates the comments cache', async () => {
    const insert = jest.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ insert });

    const { queryClient, wrapper } = createMutationWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useAddPollComment('poll-1'), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('Looks good');
    });

    expect(insert).toHaveBeenCalledWith({
      body: 'Looks good',
      poll_id: 'poll-1',
      profile_id: 'user-1',
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['poll-comments', 'poll-1'] });
  });
});

describe('useVotePoll', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockImplementation((selector) => selector(authState));
  });

  it('upserts a vote and invalidates poll vote caches', async () => {
    const upsert = jest.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ upsert });

    const { queryClient, wrapper } = createMutationWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useVotePoll('poll-1'), { wrapper });

    await act(async () => {
      await result.current.mutateAsync([0]);
    });

    expect(mockFrom).toHaveBeenCalledWith('poll_votes');
    expect(upsert).toHaveBeenCalledWith({
      option_indices: [0],
      poll_id: 'poll-1',
      profile_id: 'user-1',
      voted_at: expect.any(String),
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['poll-votes', 'poll-1'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['poll-votes', 'poll-1', 'user-1'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['polls', 'detail', 'poll-1'] });
  });

  it('rolls back optimistic vote cache updates when vote fails', async () => {
    const upsert = jest.fn().mockResolvedValue({ error: { message: 'duplicate vote' } });
    mockFrom.mockReturnValue({ upsert });

    const previousVotes = [{ poll_id: 'poll-1', profile_id: 'other-user', option_indices: [1] }];
    const previousMyVote = { poll_id: 'poll-1', profile_id: 'user-1', option_indices: [1] };

    const { queryClient, wrapper } = createMutationWrapper();
    queryClient.setQueryData(['poll-votes', 'poll-1'], previousVotes);
    queryClient.setQueryData(['poll-votes', 'poll-1', 'user-1'], previousMyVote);

    const { result } = renderHook(() => useVotePoll('poll-1'), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync([0])).rejects.toEqual({ message: 'duplicate vote' });
    });

    expect(queryClient.getQueryData(['poll-votes', 'poll-1'])).toEqual(previousVotes);
    expect(queryClient.getQueryData(['poll-votes', 'poll-1', 'user-1'])).toEqual(previousMyVote);
  });

  it('throws when voting without authentication', async () => {
    mockUseAuthStore.mockImplementation((selector) => selector({ session: null }));

    const { result } = renderHook(() => useVotePoll('poll-1'), {
      wrapper: createMutationWrapper().wrapper,
    });

    await expect(result.current.mutateAsync([0])).rejects.toThrow('Sign in required');
  });
});
