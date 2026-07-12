import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { TablesInsert, TablesUpdate } from '@/types/database';

export function useAdminAmenities(societyId?: string | null) {
  return useQuery({
    queryKey: ['admin-amenities', societyId],
    enabled: !!societyId,
    queryFn: async () => {
      const { data, error } = await supabase.from('amenities').select('*').eq('society_id', societyId!).order('name');
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertAmenity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: TablesInsert<'amenities'> | (TablesUpdate<'amenities'> & { id: string })) => {
      const id = input.id;
      const { data, error } = id
        ? await supabase.from('amenities').update(input as TablesUpdate<'amenities'>).eq('id', id).select('*').single()
        : await supabase.from('amenities').insert(input as TablesInsert<'amenities'>).select('*').single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-amenities'] });
      queryClient.invalidateQueries({ queryKey: ['amenities'] });
    },
  });
}

export function useDeleteAmenity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('amenities').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-amenities'] });
      queryClient.invalidateQueries({ queryKey: ['amenities'] });
    },
  });
}

export function useAdminAmenityBookings(amenityId?: string) {
  return useQuery({
    queryKey: ['admin-amenity-bookings', amenityId],
    enabled: !!amenityId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('amenity_bookings')
        .select('*, flats(number, towers(name)), profiles(full_name)')
        .eq('amenity_id', amenityId!)
        .order('start_at', { ascending: true });
      if (error) throw error;
      return data;
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-amenity-bookings'] }),
  });
}
