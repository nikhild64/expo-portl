import { renderHook, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { useDirectory } from './useDirectory';
import { createQueryWrapper, createSelectChain } from './__testUtils/queryTestUtils';

const mockFrom = jest.fn<any>();

jest.mock('@/lib/supabase', () => ({
  supabase: { from: (table: unknown) => mockFrom(table) },
}));

const staffMember = {
  id: 'staff-1',
  society_id: 'soc-1',
  role: 'manager',
  active: true,
  name: 'Ravi',
};

const serviceProvider = {
  id: 'svc-1',
  society_id: 'soc-1',
  category: 'plumber',
  name: 'Quick Plumber',
};

describe('useDirectory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not fetch when societyId is missing', () => {
    const { result } = renderHook(() => useDirectory(null), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.staff.fetchStatus).toBe('idle');
    expect(result.current.services.fetchStatus).toBe('idle');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('loads active staff and service providers for a society', async () => {
    const staffChain = createSelectChain({ data: [staffMember], error: null });
    const servicesChain = createSelectChain({ data: [serviceProvider], error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'staff') {
        return { select: jest.fn(() => staffChain) };
      }
      return { select: jest.fn(() => servicesChain) };
    });

    const { result } = renderHook(() => useDirectory('soc-1'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.staff.isSuccess).toBe(true));
    await waitFor(() => expect(result.current.services.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('staff');
    expect(mockFrom).toHaveBeenCalledWith('service_providers');
    expect(staffChain.eq).toHaveBeenCalledWith('society_id', 'soc-1');
    expect(staffChain.eq).toHaveBeenCalledWith('active', true);
    expect(staffChain.order).toHaveBeenCalledWith('role');
    expect(servicesChain.eq).toHaveBeenCalledWith('society_id', 'soc-1');
    expect(servicesChain.order).toHaveBeenCalledWith('category');
    expect(result.current.staff.data).toEqual([staffMember]);
    expect(result.current.services.data).toEqual([serviceProvider]);
  });
});
