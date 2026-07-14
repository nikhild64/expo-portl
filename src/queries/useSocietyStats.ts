import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export interface SocietyStats {
  residentCount: number;
  towerCount: number;
  sinceYear: number;
}

export function useSocietyStats(societyId: string | null | undefined, createdAt?: string | null) {
  return useQuery({
    queryKey: ['society-stats', societyId],
    enabled: !!societyId,
    queryFn: async (): Promise<SocietyStats> => {
      if (!societyId) {
        return { residentCount: 0, towerCount: 0, sinceYear: new Date().getFullYear() };
      }

      const [residents, towers] = await Promise.all([
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('society_id', societyId),
        supabase
          .from('towers')
          .select('id', { count: 'exact', head: true })
          .eq('society_id', societyId),
      ]);

      if (residents.error) throw residents.error;
      if (towers.error) throw towers.error;

      return {
        residentCount: residents.count ?? 0,
        towerCount: towers.count ?? 0,
        sinceYear: createdAt ? new Date(createdAt).getFullYear() : new Date().getFullYear(),
      };
    },
  });
}
