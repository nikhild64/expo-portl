import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { AmenityBookingWithPayment } from '@/features/amenities/bookingStatus';
import type { Tables, TablesInsert } from '@/types/database';

export type AmenityAvailabilityRow = Pick<
  Tables<'amenity_bookings'>,
  'amenity_id' | 'start_at' | 'end_at' | 'status'
>;

export type CancelledAmenityBooking = Pick<
  Tables<'amenity_bookings'>,
  'id' | 'total_amount' | 'created_at' | 'start_at' | 'end_at'
> & {
  amenities: { name: string } | null;
};

const PAYMENT_LOOKBACK_MS = 30 * 24 * 60 * 60 * 1000;

export function useAmenityBookings(amenityId?: string, date?: Date) {
  return useQuery({
    queryKey: ['amenity-bookings', amenityId, date?.toDateString()],
    enabled: !!amenityId && !!date,
    queryFn: async () => {
      if (!amenityId || !date) return [];

      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('amenity_availability')
        .select('amenity_id, start_at, end_at, status')
        .eq('amenity_id', amenityId)
        .gte('start_at', start.toISOString())
        .lte('start_at', end.toISOString());

      if (error) throw error;
      return (data ?? []) as AmenityAvailabilityRow[];
    },
  });
}

export function useCancelledAmenityBookings() {
  const uid = useAuthStore((s) => s.session?.user.id);
  const lookback = new Date(Date.now() - PAYMENT_LOOKBACK_MS).toISOString();

  return useQuery({
    queryKey: ['amenity-bookings', 'cancelled', uid],
    enabled: !!uid,
    queryFn: async () => {
      if (!uid) return [];

      const { data, error } = await supabase
        .from('amenity_bookings')
        .select('id, total_amount, created_at, start_at, end_at, amenities(name)')
        .eq('profile_id', uid)
        .eq('status', 'cancelled')
        .gte('created_at', lookback)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return (data ?? []) as CancelledAmenityBooking[];
    },
  });
}

export function useMyAmenityBookings() {
  const uid = useAuthStore((s) => s.session?.user.id);

  return useQuery({
    queryKey: ['amenity-bookings', 'mine', uid],
    enabled: !!uid,
    queryFn: async () => {
      if (!uid) return [];

      const [bookingsRes, failedPaymentsRes] = await Promise.all([
        supabase
          .from('amenity_bookings')
          .select('*, amenities(name), payments(status)')
          .eq('profile_id', uid)
          .order('start_at', { ascending: false })
          .limit(50),
        supabase
          .from('payments')
          .select('reference_id, status')
          .eq('profile_id', uid)
          .eq('purpose', 'amenity')
          .eq('status', 'failed'),
      ]);

      if (bookingsRes.error) throw bookingsRes.error;
      if (failedPaymentsRes.error) throw failedPaymentsRes.error;

      const failedBookingIds = new Set(
        (failedPaymentsRes.data ?? [])
          .map((payment) => payment.reference_id)
          .filter((id): id is string => !!id),
      );

      return (bookingsRes.data ?? []).map((booking) => ({
        ...booking,
        payments:
          booking.payments ??
          (failedBookingIds.has(booking.id) ? { status: 'failed' as const } : null),
      })) as AmenityBookingWithPayment[];
    },
  });
}

export function useCreateAmenityBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TablesInsert<'amenity_bookings'>) => {
      const { data, error } = await supabase.from('amenity_bookings').insert(input).select('*').single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['amenity-bookings'] }),
  });
}

export function useFailAmenityBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('amenity_bookings').update({ status: 'failed' }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-amenity-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['amenity-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useCancelAmenityBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('amenity_bookings').update({ status: 'cancelled' }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-amenity-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['amenity-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}
