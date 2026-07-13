import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

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
