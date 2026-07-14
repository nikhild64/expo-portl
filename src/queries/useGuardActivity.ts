import { useQuery } from '@tanstack/react-query';

import { startOfTodayIso } from '@/lib/format';
import { supabase } from '@/lib/supabase';

export type GuardActivityVisitor = {
  decided_at: string | null;
  entered_at: string | null;
  exited_at: string | null;
  flat_id: string;
  guard_id: string | null;
  guard_note: string | null;
  id: string;
  pre_approval_id: string | null;
  pre_approved: boolean;
  purpose: string | null;
  requested_at: string;
  resident_instructions: string | null;
  society_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'entered' | 'exited';
  type: 'guest' | 'delivery' | 'cab' | 'service';
  visitor_name: string;
  visitor_phone: string | null;
  visitor_photo_path: string | null;
  flats: { number: string; towers: { name: string } | null } | null;
};

export function useRecentActivity(societyId?: string | null) {
  return useQuery({
    queryKey: ['guard-activity', societyId],
    enabled: !!societyId,
    queryFn: async () => {
      if (!societyId) return [];

      const { data, error } = await supabase
        .from('visitors')
        .select('*, flats(number, towers(name))')
        .eq('society_id', societyId)
        .gte('requested_at', startOfTodayIso())
        .order('requested_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return (data ?? []) as GuardActivityVisitor[];
    },
  });
}
