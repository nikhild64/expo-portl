import { renderHook } from '@testing-library/react-native';
import { describe, expect, it, jest, beforeEach } from '@jest/globals';

import { useNoticesRealtime } from './useNoticesRealtime';
import { useRealtimeTable } from '@/queries/useRealtimeTable';

jest.mock('@/queries/useRealtimeTable', () => ({
  useRealtimeTable: jest.fn(),
}));

const mockUseAuthStore = jest.fn();
jest.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: any) => mockUseAuthStore(selector),
}));

describe('useNoticesRealtime', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('enables the realtime table hook when societyId is present', () => {
    mockUseAuthStore.mockImplementation((selector) =>
      selector({ profile: { society_id: 'soc-123' } }),
    );

    renderHook(() => useNoticesRealtime());

    expect(useRealtimeTable).toHaveBeenCalledWith({
      enabled: true,
      event: 'INSERT',
      filter: 'society_id=eq.soc-123',
      invalidateKeys: [['notices']],
      table: 'notices',
    });
  });

  it('disables the realtime table hook when societyId is missing', () => {
    mockUseAuthStore.mockImplementation((selector) =>
      selector({ profile: null }),
    );

    renderHook(() => useNoticesRealtime());

    expect(useRealtimeTable).toHaveBeenCalledWith({
      enabled: false,
      event: 'INSERT',
      filter: 'society_id=eq.undefined',
      invalidateKeys: [['notices']],
      table: 'notices',
    });
  });
});
