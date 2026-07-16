import { act, renderHook, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
  useAddNoticeReaction,
  useMarkNoticeRead,
  useMyNoticeReaction,
  useNoticeReactions,
  useNoticeRead,
  useRemoveNoticeReaction,
} from './useNoticeReactions';
import {
  createMutationWrapper,
  createQueryWrapper,
  createSelectChain,
} from './__testUtils/queryTestUtils';

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
const noticeId = 'notice-1';

describe('useNoticeReactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockImplementation((selector) => selector(authState));
  });

  it('aggregates reaction counts by emoji', async () => {
    const chain = createSelectChain({
      data: [
        { emoji: '👍', notice_id: noticeId, profile_id: 'user-1' },
        { emoji: '👍', notice_id: noticeId, profile_id: 'user-2' },
        { emoji: '❤️', notice_id: noticeId, profile_id: 'user-3' },
      ],
      error: null,
    });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useNoticeReactions(noticeId), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('notice_reactions');
    expect(chain.eq).toHaveBeenCalledWith('notice_id', noticeId);
    expect(result.current.data).toEqual({ '👍': 2, '❤️': 1 });
  });

  it('loads whether the signed-in user has read a notice', async () => {
    const readRow = { notice_id: noticeId, profile_id: 'user-1', read_at: '2026-07-16T10:00:00.000Z' };
    const chain = createSelectChain({ data: readRow, error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useNoticeRead(noticeId), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('notice_reads');
    expect(chain.eq).toHaveBeenCalledWith('notice_id', noticeId);
    expect(chain.eq).toHaveBeenCalledWith('profile_id', 'user-1');
    expect(chain.maybeSingle).toHaveBeenCalled();
    expect(result.current.data).toEqual(readRow);
  });

  it('loads the signed-in user reaction for a notice', async () => {
    const reaction = { emoji: '👍', notice_id: noticeId, profile_id: 'user-1' };
    const chain = createSelectChain({ data: reaction, error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useMyNoticeReaction(noticeId), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(chain.eq).toHaveBeenCalledWith('notice_id', noticeId);
    expect(chain.eq).toHaveBeenCalledWith('profile_id', 'user-1');
    expect(result.current.data).toEqual(reaction);
  });

  it('adds a reaction and optimistically updates counts', async () => {
    const upsert = jest.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ upsert });

    const { queryClient, wrapper } = createMutationWrapper();
    queryClient.setQueryData(['notice-reactions', noticeId], { '👍': 1 });
    queryClient.setQueryData(['notice-reactions', noticeId, 'mine', 'user-1'], {
      emoji: '❤️',
      notice_id: noticeId,
      profile_id: 'user-1',
    });

    const { result } = renderHook(() => useAddNoticeReaction(noticeId), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('👍');
    });

    expect(upsert).toHaveBeenCalledWith(
      { emoji: '👍', notice_id: noticeId, profile_id: 'user-1' },
      { onConflict: 'notice_id,profile_id' },
    );
    expect(queryClient.getQueryData(['notice-reactions', noticeId])).toEqual({ '👍': 2 });
    expect(queryClient.getQueryData(['notice-reactions', noticeId, 'mine', 'user-1'])).toEqual({
      emoji: '👍',
      notice_id: noticeId,
      profile_id: 'user-1',
    });
  });

  it('removes a reaction and optimistically updates counts', async () => {
    const eq = jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) });
    mockFrom.mockReturnValue({ delete: jest.fn(() => ({ eq })) });

    const { queryClient, wrapper } = createMutationWrapper();
    queryClient.setQueryData(['notice-reactions', noticeId], { '👍': 2 });
    queryClient.setQueryData(['notice-reactions', noticeId, 'mine', 'user-1'], {
      emoji: '👍',
      notice_id: noticeId,
      profile_id: 'user-1',
    });

    const { result } = renderHook(() => useRemoveNoticeReaction(noticeId), { wrapper });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(queryClient.getQueryData(['notice-reactions', noticeId])).toEqual({ '👍': 1 });
    expect(queryClient.getQueryData(['notice-reactions', noticeId, 'mine', 'user-1'])).toBeNull();
  });

  it('marks a notice as read and invalidates the read cache', async () => {
    const upsert = jest.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ upsert });

    const { queryClient, wrapper } = createMutationWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useMarkNoticeRead(noticeId), { wrapper });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(mockFrom).toHaveBeenCalledWith('notice_reads');
    expect(upsert).toHaveBeenCalledWith({
      notice_id: noticeId,
      profile_id: 'user-1',
      read_at: expect.any(String),
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['notice-reads', noticeId] });
  });
});
