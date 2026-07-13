import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { TablesInsert } from '@/types/database';

export function useAmenityBookings(amenityId?: string, date?: Date) {
  return useQuery({
    queryKey: ['amenity-bookings', amenityId, date?.toDateString()],
    enabled: !!amenityId && !!date,
    queryFn: async () => {
      const start = new Date(date!);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date!);
      end.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('amenity_bookings')
        .select('*')
        .eq('amenity_id', amenityId!)
        .gte('start_at', start.toISOString())
        .lte('start_at', end.toISOString())
        .in('status', ['pending', 'confirmed']);

      if (error) throw error;
      return data;
    },
  });
}

export function useMyAmenityBookings() {
  const uid = useAuthStore((s) => s.session?.user.id);

  return useQuery({
    queryKey: ['amenity-bookings', 'mine', uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('amenity_bookings')
        .select('*, amenities(name)')
        .eq('profile_id', uid!)
        .order('start_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
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
