import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export function useAmenities(societyId?: string | null) {
  return useQuery({
    queryKey: ['amenities', societyId],
    enabled: !!societyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('amenities')
        .select('*')
        .eq('society_id', societyId!)
        .eq('active', true)
        .order('name');

      if (error) throw error;
      return data;
    },
  });
}

export function useAmenity(id?: string) {
  return useQuery({
    queryKey: ['amenities', 'detail', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('amenities').select('*').eq('id', id!).single();
      if (error) throw error;
      return data;
    },
  });
}
