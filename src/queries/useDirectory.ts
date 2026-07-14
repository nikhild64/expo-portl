import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export function useDirectory(societyId?: string | null) {
  const staff = useQuery({
    queryKey: ['staff', societyId],
    enabled: !!societyId,
    queryFn: async () => {
      if (!societyId) return [];

      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('society_id', societyId)
        .eq('active', true)
        .order('role');

      if (error) throw error;
      return data;
    },
  });

  const services = useQuery({
    queryKey: ['services', societyId],
    enabled: !!societyId,
    queryFn: async () => {
      if (!societyId) return [];

      const { data, error } = await supabase
        .from('service_providers')
        .select('*')
        .eq('society_id', societyId)
        .order('category');

      if (error) throw error;
      return data;
    },
  });

  return { staff, services };
}
