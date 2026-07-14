import RazorpayCheckout from 'react-native-razorpay';
import type { QueryClient } from '@tanstack/react-query';

import { supabase } from './supabase';
import type { Database } from '@/types/database';

type PaymentPurpose = Database['public']['Enums']['payment_purpose'];

export type CheckoutPrefill = { contact?: string; email?: string; name?: string };

export async function createOrder(input: {
  amount: number;
  purpose: PaymentPurpose;
  referenceId?: string;
  referenceIds?: string[];
}) {
  const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
    body: input,
  });
  if (error) throw error;
  return data as { amount: number; currency: 'INR'; keyId: string; orderId: string };
}

export async function openCheckout(input: {
  amount: number;
  keyId: string;
  notes?: Record<string, string>;
  orderId: string;
  prefill: CheckoutPrefill;
}) {
  const result = await RazorpayCheckout.open({
    amount: Math.round(input.amount * 100),
    currency: 'INR',
    description: input.notes?.purpose ?? 'Payment',
    key: input.keyId,
    name: 'Portl',
    notes: input.notes,
    order_id: input.orderId,
    prefill: input.prefill,
    theme: { color: '#F97066' },
  });

  return {
    paymentId: result.razorpay_payment_id,
    signature: result.razorpay_signature,
  };
}

export async function checkoutAndInvalidate(input: {
  amount: number;
  purpose: PaymentPurpose;
  referenceId: string;
  referenceIds?: string[];
  prefill: CheckoutPrefill;
  queryClient: QueryClient;
  invalidateKeys: string[][];
}) {
  const { orderId, keyId } = await createOrder({
    amount: input.amount,
    purpose: input.purpose,
    referenceId: input.referenceId,
    referenceIds: input.referenceIds,
  });

  await openCheckout({
    amount: input.amount,
    keyId,
    notes: {
      purpose: input.purpose,
      referenceId: input.referenceId,
      ...(input.referenceIds?.length ? { referenceIds: input.referenceIds.join(',') } : {}),
    },
    orderId,
    prefill: input.prefill,
  });

  await Promise.all(
    input.invalidateKeys.map((queryKey) => input.queryClient.invalidateQueries({ queryKey })),
  );
}
