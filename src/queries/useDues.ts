import { useQuery } from '@tanstack/react-query';

import { titleize } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { Tables } from '@/types/database';

export type LabeledPayment = Tables<'payments'> & { label: string };

async function labelPayments(payments: Tables<'payments'>[]): Promise<LabeledPayment[]> {
  const dueIds = payments
    .filter((payment) => payment.purpose === 'dues' && payment.reference_id)
    .map((payment) => payment.reference_id!);
  const bookingIds = payments
    .filter((payment) => payment.purpose === 'amenity' && payment.reference_id)
    .map((payment) => payment.reference_id!);

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

  return payments.map((payment) => ({
    ...payment,
    label:
      payment.purpose === 'dues' && payment.reference_id
        ? (duesById.get(payment.reference_id) ?? 'Dues payment')
        : payment.purpose === 'amenity' && payment.reference_id
          ? (amenityByBookingId.get(payment.reference_id) ?? 'Amenity booking')
          : titleize(payment.purpose),
  }));
}

/** @deprecated Use LabeledPayment */
export type PendingPayment = LabeledPayment;

export function useDuesCurrent(flatIds: string[] | undefined) {
  return useQuery({
    queryKey: ['dues', 'current', flatIds],
    enabled: !!flatIds?.length,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dues')
        .select('*')
        .in('flat_id', flatIds!)
        .in('status', ['due', 'overdue', 'partial'])
        .order('due_date', { ascending: true })
        .limit(1);

      if (error) throw error;
      return data[0] ?? null;
    },
  });
}

export function useDuesHistory(flatIds: string[] | undefined) {
  return useQuery({
    queryKey: ['dues', 'history', flatIds],
    enabled: !!flatIds?.length,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dues')
        .select('*')
        .in('flat_id', flatIds!)
        .eq('status', 'paid')
        .order('period', { ascending: false })
        .limit(12);

      if (error) throw error;
      return data;
    },
  });
}

export function usePendingPayments() {
  const uid = useAuthStore((s) => s.session?.user.id);

  return useQuery({
    queryKey: ['payments', 'pending', uid],
    enabled: !!uid,
    refetchInterval: (query) => ((query.state.data?.length ?? 0) > 0 ? 5_000 : false),
    queryFn: async (): Promise<LabeledPayment[]> => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('profile_id', uid!)
        .eq('status', 'created')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return labelPayments(data ?? []);
    },
  });
}

export function useFailedPayments() {
  const uid = useAuthStore((s) => s.session?.user.id);

  return useQuery({
    queryKey: ['payments', 'failed', uid],
    enabled: !!uid,
    queryFn: async (): Promise<LabeledPayment[]> => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('profile_id', uid!)
        .eq('status', 'failed')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return labelPayments(data ?? []);
    },
  });
}
