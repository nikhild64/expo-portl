import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';

import { titleize } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { Tables } from '@/types/database';

export type LabeledPayment = Tables<'payments'> & { label: string };

async function labelPayments(payments: Tables<'payments'>[]): Promise<LabeledPayment[]> {
  const dueIds = payments
    .flatMap((payment) => {
      if (payment.purpose !== 'dues') return [];
      const ids = payment.reference_ids?.length ? payment.reference_ids : [];
      return payment.reference_id ? [payment.reference_id, ...ids] : ids;
    })
    .filter((id, index, all) => all.indexOf(id) === index);
  const bookingIds = payments
    .filter((payment) => payment.purpose === 'amenity' && payment.reference_id)
    .map((payment) => payment.reference_id as string);

  const duesById = new Map<string, string>();
  if (dueIds.length) {
    const { data: dues } = await supabase.from('dues').select('id, period').in('id', dueIds);
    for (const due of dues ?? []) duesById.set(due.id, due.period);
  }

  const amenityByBookingId = new Map<string, string>();
  if (bookingIds.length) {
    const { data: bookings } = await supabase
      .from('amenity_bookings')
      .select('id, amenities(name)')
      .in('id', bookingIds);
    for (const booking of bookings ?? []) {
      amenityByBookingId.set(booking.id, booking.amenities?.name ?? 'Amenity booking');
    }
  }

  return payments.map((payment) => {
    const referenceIds = payment.reference_ids ?? [];
    return {
      ...payment,
      label:
        payment.purpose === 'dues' && referenceIds.length > 1
          ? `${referenceIds.length} months dues`
          : payment.purpose === 'dues' && payment.reference_id
            ? (duesById.get(payment.reference_id) ?? 'Dues payment')
            : payment.purpose === 'amenity' && payment.reference_id
              ? (amenityByBookingId.get(payment.reference_id) ?? 'Amenity booking')
              : titleize(payment.purpose),
    };
  });
}

async function filterSettledAmenityPayments(uid: string, payments: Tables<'payments'>[]) {
  const amenityRefIds = payments
    .filter((payment) => payment.purpose === 'amenity' && payment.reference_id)
    .map((payment) => payment.reference_id as string);

  if (!amenityRefIds.length) return payments;

  const [{ data: bookings }, { data: captured }] = await Promise.all([
    supabase
      .from('amenity_bookings')
      .select('id')
      .in('id', amenityRefIds)
      .in('status', ['confirmed', 'completed']),
    supabase
      .from('payments')
      .select('reference_id')
      .eq('profile_id', uid)
      .eq('purpose', 'amenity')
      .eq('status', 'captured')
      .in('reference_id', amenityRefIds),
  ]);

  const settledRefIds = new Set<string>([
    ...(bookings ?? []).map((booking) => booking.id),
    ...(captured ?? [])
      .map((payment) => payment.reference_id)
      .filter((id): id is string => !!id),
  ]);

  return payments.filter(
    (payment) =>
      payment.purpose !== 'amenity' ||
      !payment.reference_id ||
      !settledRefIds.has(payment.reference_id),
  );
}

export function useDuesOutstanding(flatIds: string[] | undefined) {
  return useQuery({
    queryKey: ['dues', 'outstanding', flatIds],
    enabled: !!flatIds?.length,
    queryFn: async () => {
      if (!flatIds?.length) return [];

      const { data, error } = await supabase
        .from('dues')
        .select('*')
        .in('flat_id', flatIds)
        .in('status', ['due', 'overdue', 'partial'])
        .order('period', { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useDuesHistory(flatIds: string[] | undefined) {
  return useQuery({
    queryKey: ['dues', 'history', flatIds],
    enabled: !!flatIds?.length,
    queryFn: async () => {
      if (!flatIds?.length) return [];

      const { data, error } = await supabase
        .from('dues')
        .select('*')
        .in('flat_id', flatIds)
        .eq('status', 'paid')
        .order('period', { ascending: false })
        .limit(12);

      if (error) throw error;
      return data;
    },
  });
}

const MAX_PENDING_POLL_ITERATIONS = 24;
const PENDING_POLL_INTERVAL_MS = 5_000;

export function usePendingPayments() {
  const uid = useAuthStore((s) => s.session?.user.id);
  const pollCountRef = useRef(0);

  const query = useQuery({
    queryKey: ['payments', 'pending', uid],
    enabled: !!uid,
    queryFn: async (): Promise<LabeledPayment[]> => {
      if (!uid) return [];

      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('profile_id', uid)
        .eq('status', 'created')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      const pending = await filterSettledAmenityPayments(uid, data ?? []);
      return labelPayments(pending);
    },
    refetchInterval: (q) => {
      const pendingCount = q.state.data?.length ?? 0;
      if (!pendingCount) {
        pollCountRef.current = 0;
        return false;
      }
      pollCountRef.current += 1;
      if (pollCountRef.current > MAX_PENDING_POLL_ITERATIONS) return false;
      return PENDING_POLL_INTERVAL_MS;
    },
  });

  const pollExhausted =
    (query.data?.length ?? 0) > 0 && pollCountRef.current > MAX_PENDING_POLL_ITERATIONS;

  return { ...query, pollExhausted };
}

export function useFailedPayments() {
  const uid = useAuthStore((s) => s.session?.user.id);

  return useQuery({
    queryKey: ['payments', 'failed', uid],
    enabled: !!uid,
    queryFn: async (): Promise<LabeledPayment[]> => {
      if (!uid) return [];

      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('profile_id', uid)
        .eq('status', 'failed')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return labelPayments(data ?? []);
    },
  });
}

export function useCapturedAmenityPayments() {
  const uid = useAuthStore((s) => s.session?.user.id);

  return useQuery({
    queryKey: ['payments', 'captured-amenity', uid],
    enabled: !!uid,
    queryFn: async (): Promise<LabeledPayment[]> => {
      if (!uid) return [];

      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('profile_id', uid)
        .eq('purpose', 'amenity')
        .eq('status', 'captured')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return labelPayments(data ?? []);
    },
  });
}
