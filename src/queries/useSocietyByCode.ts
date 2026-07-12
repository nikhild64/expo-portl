import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useSocietyByCode(code: string) {
  return useQuery({
    queryKey: ['society-by-code', code],
    enabled: code.trim().length >= 4,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('societies')
        .select('*')
        .eq('code', code.trim().toUpperCase())
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
