import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { endOfTodayIso, startOfTodayIso } from '@/lib/format';
import { supabase } from '@/lib/supabase';

export type VisitorLogRow = {
  entered_at: string | null;
  exited_at: string | null;
  flat_id: string;
  id: string;
  requested_at: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'entered' | 'exited';
  type: 'guest' | 'delivery' | 'cab' | 'service';
  visitor_name: string;
  visitor_phone: string | null;
  visitor_photo_url: string | null;
  flats: { number: string; tower_id: string; towers: { name: string } | null } | null;
};

export function useVisitorLog(societyId?: string | null, towerId?: string | null) {
  return useQuery({
    queryKey: ['visitor-log', societyId, towerId],
    enabled: !!societyId,
    queryFn: async () => {
      let query = supabase
        .from('visitors')
        .select('id, flat_id, visitor_name, visitor_phone, visitor_photo_url, type, status, requested_at, entered_at, exited_at, flats!inner(number, tower_id, towers(name))')
        .eq('society_id', societyId!)
        .gte('requested_at', startOfTodayIso())
        .lte('requested_at', endOfTodayIso());

      if (towerId) {
        query = query.eq('flats.tower_id', towerId);
      }

      const { data, error } = await query.order('requested_at', { ascending: false }).limit(100);
      if (error) throw error;
      return (data ?? []) as VisitorLogRow[];
    },
  });
}

export function useMarkExit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (visitorId: string) => {
      const { error } = await supabase
        .from('visitors')
        .update({ exited_at: new Date().toISOString(), status: 'exited' })
        .eq('id', visitorId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitor-log'] });
      queryClient.invalidateQueries({ queryKey: ['guard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['guard-activity'] });
    },
  });
}
