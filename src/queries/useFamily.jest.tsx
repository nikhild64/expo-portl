import { act, renderHook, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
  flatResidentSubtitle,
  useCreateFamilyMember,
  useDeleteFamilyMember,
  useFamily,
  useFlatResidents,
} from './useFamily';
import {
  createMutationWrapper,
  createQueryWrapper,
  createSelectChain,
} from './__testUtils/queryTestUtils';

const mockFrom = jest.fn<any>();
const mockUseAuthStore = jest.fn<any>();

jest.mock('@/lib/supabase', () => ({
  supabase: { from: (table: unknown) => mockFrom(table) },
}));

jest.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: any) => any) => mockUseAuthStore(selector),
}));

jest.mock('@/lib/format', () => ({
  formatFlatLabel: (tower?: string | null, number?: string | null) =>
    tower && number ? `${tower} ${number}` : 'Unknown',
}));

const authState = { session: { user: { id: 'user-1' } } };

function extendSelectChain<T>(
  result: { data: T; error: null } | { data: null; error: { message: string } },
) {
  const chain = createSelectChain(result) as ReturnType<typeof createSelectChain> & {
    neq: jest.Mock;
  };
  chain.neq = jest.fn().mockReturnValue(chain);
  return chain;
}

describe('useFamily', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockImplementation((selector: any) => selector(authState));
  });

  it('does not fetch when the user is not signed in', () => {
    mockUseAuthStore.mockImplementation((selector: any) => selector({ session: null }));

    const { result } = renderHook(() => useFamily(), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('loads family members for the signed-in user', async () => {
    const members = [{ id: 'fm-1', profile_id: 'user-1', name: 'Alex Family' }];
    const chain = createSelectChain({ data: members, error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useFamily(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('family_members');
    expect(chain.eq).toHaveBeenCalledWith('profile_id', 'user-1');
    expect(chain.order).toHaveBeenCalledWith('name');
    expect(result.current.data).toEqual(members);
  });

  it('loads flat residents excluding the signed-in user', async () => {
    const myFlatsChain = createSelectChain({ data: [{ flat_id: 'flat-1' }], error: null });
    const residentsChain = extendSelectChain({
      data: [
        {
          profile_id: 'user-2',
          flat_id: 'flat-1',
          is_head: true,
          is_owner: false,
          profiles: { full_name: 'Jamie Resident', status: 'active' },
          flats: { number: '101', towers: { name: 'A Block' } },
        },
      ],
      error: null,
    });

    let flatResidentsCalls = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table !== 'flat_residents') throw new Error(`Unexpected table: ${table}`);
      flatResidentsCalls += 1;
      if (flatResidentsCalls === 1) return { select: jest.fn(() => myFlatsChain) };
      return { select: jest.fn(() => residentsChain) };
    });

    const { result } = renderHook(() => useFlatResidents(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(residentsChain.in).toHaveBeenCalledWith('flat_id', ['flat-1']);
    expect(residentsChain.neq).toHaveBeenCalledWith('profile_id', 'user-1');
    expect(result.current.data).toEqual([
      {
        profile_id: 'user-2',
        flat_id: 'flat-1',
        flat_label: 'A Block 101',
        full_name: 'Jamie Resident',
        is_head: true,
        is_owner: false,
      },
    ]);
    expect(flatResidentSubtitle(result.current.data![0])).toBe('A Block 101 · Head of family');
  });

  it('creates a family member and invalidates the list', async () => {
    const insert = jest.fn<(...args: any[]) => any>().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ insert });

    const { queryClient, wrapper } = createMutationWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useCreateFamilyMember(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ profile_id: 'user-1', name: 'Alex Family' } as never);
    });

    expect(mockFrom).toHaveBeenCalledWith('family_members');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['family'] });
  });

  it('deletes a family member and invalidates the list', async () => {
    const eq = jest.fn<(...args: any[]) => any>().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ delete: jest.fn(() => ({ eq })) });

    const { queryClient, wrapper } = createMutationWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useDeleteFamilyMember(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('fm-1');
    });

    expect(eq).toHaveBeenCalledWith('id', 'fm-1');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['family'] });
  });

  it('covers flatResidentSubtitle formats', () => {
    const ownerMember = {
      profile_id: 'user-2',
      flat_id: 'flat-1',
      flat_label: 'A Block 101',
      full_name: 'Jamie Resident',
      is_head: false,
      is_owner: true,
    };
    const residentMember = {
      profile_id: 'user-3',
      flat_id: 'flat-1',
      flat_label: 'A Block 101',
      full_name: 'Resident Name',
      is_head: false,
      is_owner: false,
    };

    expect(flatResidentSubtitle(ownerMember)).toBe('A Block 101 · Owner');
    expect(flatResidentSubtitle(residentMember)).toBe('A Block 101 · Resident');
  });

  it('merges duplicate profile residents living in multiple flats', async () => {
    const myFlatsChain = createSelectChain({ data: [{ flat_id: 'flat-1' }], error: null });
    const residentsChain = extendSelectChain({
      data: [
        {
          profile_id: 'user-2',
          flat_id: 'flat-1',
          is_head: true,
          is_owner: false,
          profiles: { full_name: 'Jamie Resident', status: 'active' },
          flats: { number: '101', towers: { name: 'A Block' } },
        },
        {
          profile_id: 'user-2',
          flat_id: 'flat-2',
          is_head: false,
          is_owner: true,
          profiles: { full_name: 'Jamie Resident', status: 'active' },
          flats: { number: '102', towers: { name: 'A Block' } },
        },
        {
          profile_id: 'user-2',
          flat_id: 'flat-2',
          is_head: false,
          is_owner: false,
          profiles: { full_name: 'Jamie Resident', status: 'active' },
          flats: { number: '102', towers: { name: 'A Block' } },
        },
        {
          profile_id: 'user-3',
          flat_id: 'flat-1',
          is_head: false,
          is_owner: false,
          profiles: { full_name: 'Inactive User', status: 'pending' },
          flats: { number: '101', towers: { name: 'A Block' } },
        },
        {
          profile_id: 'user-4',
          flat_id: 'flat-1',
          is_head: false,
          is_owner: false,
          profiles: null,
          flats: { number: '101', towers: { name: 'A Block' } },
        },
        {
          profile_id: 'user-5',
          flat_id: 'flat-1',
          is_head: false,
          is_owner: false,
          profiles: { full_name: 'No Flat User', status: 'active' },
          flats: null,
        },
      ],
      error: null,
    });

    let flatResidentsCalls = 0;
    mockFrom.mockImplementation((table: string) => {
      flatResidentsCalls += 1;
      if (flatResidentsCalls === 1) return { select: jest.fn(() => myFlatsChain) };
      return { select: jest.fn(() => residentsChain) };
    });

    const { result } = renderHook(() => useFlatResidents(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([
      {
        profile_id: 'user-2',
        flat_id: 'flat-1',
        flat_label: 'A Block 101, A Block 102',
        full_name: 'Jamie Resident',
        is_head: true,
        is_owner: true,
      },
      {
        profile_id: 'user-5',
        flat_id: 'flat-1',
        flat_label: 'Unknown',
        full_name: 'No Flat User',
        is_head: false,
        is_owner: false,
      },
    ]);
  });

  it('returns empty list when flatIds is empty or myFlatsError/residentsError is thrown', async () => {
    const myFlatsChainErr = createSelectChain({ data: null, error: { message: 'myFlats DB Error' } });
    mockFrom.mockReturnValue({ select: jest.fn(() => myFlatsChainErr) });

    const { result: res1 } = renderHook(() => useFlatResidents(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(res1.current.isError).toBe(true));
    expect(res1.current.error?.message).toBe('myFlats DB Error');

    jest.clearAllMocks();
    const myFlatsChainEmpty = createSelectChain({ data: [], error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => myFlatsChainEmpty) });

    const { result: res2 } = renderHook(() => useFlatResidents(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(res2.current.isSuccess).toBe(true));
    expect(res2.current.data).toEqual([]);

    jest.clearAllMocks();
    const myFlatsChain = createSelectChain({ data: [{ flat_id: 'flat-1' }], error: null });
    const residentsChainErr = extendSelectChain({ data: null, error: { message: 'residents DB Error' } });
    let calls = 0;
    mockFrom.mockImplementation(() => {
      calls += 1;
      if (calls === 1) return { select: jest.fn(() => myFlatsChain) };
      return { select: jest.fn(() => residentsChainErr) };
    });

    const { result: res3 } = renderHook(() => useFlatResidents(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(res3.current.isError).toBe(true));
    expect(res3.current.error?.message).toBe('residents DB Error');
  });

  it('throws error when useFamily database query fails', async () => {
    const chain = createSelectChain({ data: null, error: { message: 'family DB Error' } });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useFamily(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('family DB Error');
  });

  it('throws error when useCreateFamilyMember mutation fails', async () => {
    const errorMsg = 'mutation error';
    const insert = jest.fn<(...args: any[]) => any>().mockResolvedValue({ error: new Error(errorMsg) });
    mockFrom.mockReturnValue({ insert });

    const { wrapper } = createMutationWrapper();
    const { result } = renderHook(() => useCreateFamilyMember(), { wrapper });

    await expect(
      result.current.mutateAsync({ name: 'Alex' } as never)
    ).rejects.toThrow(errorMsg);
  });

  it('throws error when useDeleteFamilyMember mutation fails', async () => {
    const errorMsg = 'mutation error';
    const eq = jest.fn<(...args: any[]) => any>().mockResolvedValue({ error: new Error(errorMsg) });
    mockFrom.mockReturnValue({ delete: jest.fn(() => ({ eq })) });

    const { wrapper } = createMutationWrapper();
    const { result } = renderHook(() => useDeleteFamilyMember(), { wrapper });

    await expect(
      result.current.mutateAsync('fm-1')
    ).rejects.toThrow(errorMsg);
  });

  it('runs onSuccess invalidate on successful create and delete family member', async () => {
    const insert = jest.fn<(...args: any[]) => any>().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ insert });

    const { queryClient, wrapper } = createMutationWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result: createRes } = renderHook(() => useCreateFamilyMember(), { wrapper });
    await act(async () => {
      await createRes.current.mutateAsync({ name: 'New Member' } as never);
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['family'] });

    const eq = jest.fn<(...args: any[]) => any>().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ delete: jest.fn(() => ({ eq })) });
    const { result: deleteRes } = renderHook(() => useDeleteFamilyMember(), { wrapper });
    await act(async () => {
      await deleteRes.current.mutateAsync('fm-1');
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['family'] });
  });

  it('handles null uid refetches and empty flats responses safely', async () => {
    // Mock user to be signed out
    mockUseAuthStore.mockImplementation((selector: any) => selector({ session: null }));

    const { queryClient, wrapper } = createMutationWrapper();
    renderHook(() => useFlatResidents(), { wrapper });
    renderHook(() => useFamily(), { wrapper });

    const queries = queryClient.getQueryCache().getAll();

    // 1. flat-residents with null uid
    const frQuery = queries.find(q => q.queryKey[0] === 'family' && q.queryKey[1] === 'flat-residents');
    const frQueryFn = frQuery?.options.queryFn as ((ctx: any) => Promise<any>) | undefined;
    const frData = await frQueryFn?.({} as any);
    expect(frData).toEqual([]);

    // 2. family with null uid
    const famQuery = queries.find(q => q.queryKey[0] === 'family' && q.queryKey[1] !== 'flat-residents');
    const famQueryFn = famQuery?.options.queryFn as ((ctx: any) => Promise<any>) | undefined;
    const famData = await famQueryFn?.({} as any);
    expect(famData).toEqual([]);

    // Restore user to be signed in
    mockUseAuthStore.mockImplementation((selector: any) => selector(authState));

    // 3. flat-residents returning null flats
    const myFlatsChain = createSelectChain({ data: null, error: null } as any);
    mockFrom.mockReturnValue({ select: jest.fn(() => myFlatsChain) });
    const { result: frResNull } = renderHook(() => useFlatResidents(), { wrapper: createQueryWrapper() });
    await waitFor(() => expect(frResNull.current.isSuccess).toBe(true));
    expect(frResNull.current.data).toEqual([]);
  });
});
