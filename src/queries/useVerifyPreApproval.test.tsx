import { act, renderHook } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { useVerifyPreApproval } from './useVerifyPreApproval';
import { createMutationWrapper } from './__testUtils/queryTestUtils';

const mockRpc = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: { rpc: (fn: string, args: unknown) => mockRpc(fn, args) },
}));

const validResult = {
  flat_id: 'flat-1',
  pre_approval_id: 'pa-1',
  reason: 'valid',
  type: 'guest',
  valid: true,
  visitor_name: 'Alex Guest',
  visitor_phone: '+911234567890',
};

describe('useVerifyPreApproval', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the rpc verification result for a valid code', async () => {
    mockRpc.mockResolvedValue({ data: [validResult], error: null });

    const { result } = renderHook(() => useVerifyPreApproval(), {
      wrapper: createMutationWrapper().wrapper,
    });

    let verificationResult: typeof validResult | undefined;
    await act(async () => {
      verificationResult = await result.current.mutateAsync('CODE123');
    });

    expect(mockRpc).toHaveBeenCalledWith('verify_preapproval', { p_code: 'CODE123' });
    expect(verificationResult).toEqual(validResult);
  });

  it('returns the default invalid result when rpc data is empty', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });

    const { result } = renderHook(() => useVerifyPreApproval(), {
      wrapper: createMutationWrapper().wrapper,
    });

    let verificationResult: Record<string, unknown> | undefined;
    await act(async () => {
      verificationResult = await result.current.mutateAsync('BADCODE');
    });

    expect(verificationResult).toEqual({
      flat_id: null,
      pre_approval_id: null,
      reason: 'invalid_code',
      type: null,
      valid: false,
      visitor_name: null,
      visitor_phone: null,
    });
  });

  it('throws when the rpc call fails', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'rpc failed' } });

    const { result } = renderHook(() => useVerifyPreApproval(), {
      wrapper: createMutationWrapper().wrapper,
    });

    await act(async () => {
      await expect(result.current.mutateAsync('CODE123')).rejects.toEqual({ message: 'rpc failed' });
    });
  });
});
