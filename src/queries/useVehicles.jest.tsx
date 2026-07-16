import { act, renderHook, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { useCreateVehicle, useDeleteVehicle, useVehicles } from './useVehicles';
import { createMutationWrapper, createQueryWrapper, createSelectChain } from './__testUtils/queryTestUtils';

const mockFrom = jest.fn();
const flatIds = ['flat-1'];

jest.mock('@/lib/supabase', () => ({
  supabase: { from: (table: string) => mockFrom(table) },
}));

describe('useVehicles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads vehicles for the given flats', async () => {
    const chain = createSelectChain({ data: [{ id: 'veh-1', flat_id: 'flat-1' }], error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useVehicles(flatIds), { wrapper: createQueryWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('vehicles');
    expect(chain.in).toHaveBeenCalledWith('flat_id', flatIds);
    expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('creates a vehicle and invalidates the list', async () => {
    const insert = jest.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ insert });

    const { queryClient, wrapper } = createMutationWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useCreateVehicle(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ flat_id: 'flat-1', plate_number: 'KA01AB1234' } as never);
    });

    expect(insert).toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['vehicles'] });
  });

  it('deletes a vehicle and invalidates the list', async () => {
    const eq = jest.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ delete: jest.fn(() => ({ eq })) });

    const { queryClient, wrapper } = createMutationWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useDeleteVehicle(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('veh-1');
    });

    expect(eq).toHaveBeenCalledWith('id', 'veh-1');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['vehicles'] });
  });
});
