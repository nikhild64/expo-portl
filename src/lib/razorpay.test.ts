const mockInvoke = jest.fn();
const mockOpen = jest.fn();
const mockInvalidateQueries = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    functions: { invoke: (...args: unknown[]) => mockInvoke(...args) },
  },
}));

jest.mock('react-native-razorpay', () => ({
  __esModule: true,
  default: { open: (...args: unknown[]) => mockOpen(...args) },
}));

import { checkoutAndInvalidate, createOrder, openCheckout } from './razorpay';

describe('razorpay helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInvoke.mockResolvedValue({
      data: { amount: 1500, currency: 'INR', keyId: 'key-1', orderId: 'order-1' },
      error: null,
    });
    mockOpen.mockResolvedValue({
      razorpay_payment_id: 'pay-1',
      razorpay_signature: 'sig-1',
    });
    mockInvalidateQueries.mockResolvedValue(undefined);
  });

  it('creates a Razorpay order via the edge function', async () => {
    const order = await createOrder({
      amount: 1500,
      purpose: 'dues',
      referenceId: 'due-1',
      referenceIds: ['due-1', 'due-2'],
    });

    expect(mockInvoke).toHaveBeenCalledWith('create-razorpay-order', {
      body: {
        amount: 1500,
        purpose: 'dues',
        referenceId: 'due-1',
        referenceIds: ['due-1', 'due-2'],
      },
    });
    expect(order).toEqual({
      amount: 1500,
      currency: 'INR',
      keyId: 'key-1',
      orderId: 'order-1',
    });
  });

  it('opens the native checkout sheet with paise amount', async () => {
    const result = await openCheckout({
      amount: 12.5,
      keyId: 'key-1',
      orderId: 'order-1',
      prefill: { contact: '9999999999', email: 'a@test.com', name: 'A' },
      notes: { purpose: 'dues' },
    });

    expect(mockOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 1250,
        currency: 'INR',
        key: 'key-1',
        order_id: 'order-1',
        prefill: { contact: '9999999999', email: 'a@test.com', name: 'A' },
      }),
    );
    expect(result).toEqual({ paymentId: 'pay-1', signature: 'sig-1' });
  });

  it('runs checkout and invalidates payment query caches', async () => {
    const queryClient = { invalidateQueries: mockInvalidateQueries };

    await checkoutAndInvalidate({
      amount: 1500,
      purpose: 'dues',
      referenceId: 'due-1',
      referenceIds: ['due-1'],
      prefill: { name: 'Resident' },
      queryClient: queryClient as never,
      invalidateKeys: [['dues'], ['payments', 'pending']],
    });

    expect(mockInvoke).toHaveBeenCalled();
    expect(mockOpen).toHaveBeenCalled();
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['dues'] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['payments', 'pending'] });
  });
});
