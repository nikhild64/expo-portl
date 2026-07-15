import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { alertError, alertSuccess } from '@/lib/alert';
import i18n from '@/i18n';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { Database, Tables, TablesInsert } from '@/types/database';

type VisitorType = Database['public']['Enums']['visitor_type'];

export function useFrequentVisitors() {
  const uid = useAuthStore((s) => s.session?.user.id);

  return useQuery({
    queryKey: ['frequent-visitors', uid],
    enabled: !!uid,
    queryFn: async () => {
      if (!uid) return [];

      const { data, error } = await supabase
        .from('frequent_visitors')
        .select('*')
        .eq('profile_id', uid)
        .order('visitor_name');

      if (error) throw error;
      return (data ?? []) as Tables<'frequent_visitors'>[];
    },
  });
}

export function useSaveFrequentVisitor() {
  const queryClient = useQueryClient();
  const uid = useAuthStore((s) => s.session?.user.id);

  return useMutation({
    mutationFn: async (input: Pick<TablesInsert<'frequent_visitors'>, 'visitor_name' | 'visitor_phone' | 'visitor_type'>) => {
      if (!uid) throw new Error('not_authenticated');

      const { error } = await supabase.from('frequent_visitors').upsert(
        {
          profile_id: uid,
          visitor_name: input.visitor_name.trim(),
          visitor_phone: input.visitor_phone.trim(),
          visitor_type: input.visitor_type,
        },
        { onConflict: 'profile_id,visitor_phone' },
      );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['frequent-visitors'] });
      alertSuccess(i18n.t('alert.titles.frequentVisitorSaved'), i18n.t('resident.preapprove.frequentVisitorSaved'));
    },
    onError: (error) => alertError(i18n.t('alert.titles.couldNotSavePreference'), error),
  });
}

export type FrequentVisitorInput = {
  visitor_name: string;
  visitor_phone: string;
  visitor_type: VisitorType;
};
