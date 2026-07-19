import { act, renderHook, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import './__testUtils/queryTestUtils';
import { useActiveSos, useTriggerSos, useCancelSos } from './useSos';
import { createQueryWrapper, createMutationWrapper } from './__testUtils/queryTestUtils';

const mockFrom: any = jest.fn();
const mockUseAuthStore: any = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: unknown) => mockFrom(table),
  },
}));

jest.mock('@/queries/useRealtimeTable', () => ({
  useRealtimeTable: jest.fn(),
}));

jest.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: any) => mockUseAuthStore(selector),
}));

describe('useSos queries and mutations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useActiveSos', () => {
    it('queries active SOS alert when user is logged in', async () => {
      mockUseAuthStore.mockImplementation((selector: any) => {
        return selector({
          session: { user: { id: 'user-123' } },
        });
      });

      const mockSingle = jest.fn<(...args: any[]) => any>().mockResolvedValue({
        data: { id: 'sos-123', status: 'active', created_by: 'user-123' },
        error: null,
      });
      const mockLimit = jest.fn().mockReturnValue({ maybeSingle: mockSingle });
      const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockEq2 = jest.fn().mockReturnValue({ order: mockOrder });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });

      mockFrom.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useActiveSos(), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual({ id: 'sos-123', status: 'active', created_by: 'user-123' });
      expect(mockFrom).toHaveBeenCalledWith('sos_alerts');
      expect(mockSelect).toHaveBeenCalled();
    });
  });

  describe('useTriggerSos', () => {
    it('triggers SOS successfully', async () => {
      mockUseAuthStore.mockImplementation((selector: any) => {
        return selector({
          session: { user: { id: 'user-123' } },
          profile: { society_id: 'society-123' },
        });
      });

      const mockSingle = jest.fn<(...args: any[]) => any>().mockResolvedValue({
        data: { id: 'sos-123', status: 'active', created_by: 'user-123', society_id: 'society-123' },
        error: null,
      });
      const mockInsert = jest.fn().mockReturnValue({ select: () => ({ single: mockSingle }) });

      mockFrom.mockReturnValue({
        insert: mockInsert,
      });

      const { result } = renderHook(() => useTriggerSos(), {
        wrapper: createMutationWrapper().wrapper,
      });

      act(() => {
        result.current.mutate({ flatId: 'flat-456' });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual({ id: 'sos-123', status: 'active', created_by: 'user-123', society_id: 'society-123' });
      expect(mockInsert).toHaveBeenCalledWith({
        society_id: 'society-123',
        flat_id: 'flat-456',
        created_by: 'user-123',
        status: 'active',
      });
    });
  });

  describe('useCancelSos', () => {
    it('cancels/resolves SOS successfully', async () => {
      mockUseAuthStore.mockImplementation((selector: any) => {
        return selector({
          session: { user: { id: 'guard-789' } },
        });
      });

      const mockSingle = jest.fn<(...args: any[]) => any>().mockResolvedValue({
        data: { id: 'sos-123', status: 'resolved', resolved_by: 'guard-789' },
        error: null,
      });
      const mockEq = jest.fn().mockReturnValue({ select: () => ({ single: mockSingle }) });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });

      mockFrom.mockReturnValue({
        update: mockUpdate,
      });

      const { result } = renderHook(() => useCancelSos(), {
        wrapper: createMutationWrapper().wrapper,
      });

      act(() => {
        result.current.mutate('sos-123');
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual({ id: 'sos-123', status: 'resolved', resolved_by: 'guard-789' });
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'resolved',
          resolved_by: 'guard-789',
        })
      );
      expect(mockEq).toHaveBeenCalledWith('id', 'sos-123');
    });
  });
});
