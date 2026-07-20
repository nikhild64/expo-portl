import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useRealtimeTable } from './useRealtimeTable';

export function useActiveSos() {
  const uid = useAuthStore((s) => s.session?.user?.id);

  useRealtimeTable({
    enabled: !!uid,
    table: 'sos_alerts',
    filter: `created_by=eq.${uid}`,
    invalidateKeys: [['sos', 'active', uid]],
  });

  return useQuery({
    queryKey: ['sos', 'active', uid],
    enabled: !!uid,
    queryFn: async () => {
      if (!uid) return null;
      const { data, error } = await supabase
        .from('sos_alerts')
        .select(`
          *,
          resolved_by_profile:resolved_by (
            full_name
          )
        `)
        .eq('created_by', uid)
        .in('status', ['active', 'acknowledged'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
}

export function useTriggerSos() {
  const queryClient = useQueryClient();
  const uid = useAuthStore((s) => s.session?.user?.id);
  const profile = useAuthStore((s) => s.profile);

  return useMutation({
    mutationFn: async (params: { flatId?: string | null }) => {
      if (!uid || !profile?.society_id) {
        throw new Error('User profile is not ready');
      }

      const { data, error } = await supabase
        .from('sos_alerts')
        .insert({
          society_id: profile.society_id,
          flat_id: params.flatId || null,
          created_by: uid,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (uid) {
        queryClient.invalidateQueries({ queryKey: ['sos', 'active', uid] });
      }
    },
  });
}

export function useCancelSos() {
  const queryClient = useQueryClient();
  const uid = useAuthStore((s) => s.session?.user?.id);

  return useMutation({
    mutationFn: async (alertId: string) => {
      const { data, error } = await supabase
        .from('sos_alerts')
        .update({
          status: 'resolved',
          resolved_by: uid,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', alertId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (uid) {
        queryClient.invalidateQueries({ queryKey: ['sos', 'active', uid] });
      }
    },
  });
}
