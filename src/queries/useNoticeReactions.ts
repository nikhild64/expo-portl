import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

export function useNoticeReactions(noticeId?: string) {
  return useQuery({
    queryKey: ['notice-reactions', noticeId],
    enabled: !!noticeId,
    queryFn: async () => {
      const { data, error } = await supabase.from('notice_reactions').select('*').eq('notice_id', noticeId!);
      if (error) throw error;

      return data.reduce<Record<string, number>>((counts, reaction) => {
        counts[reaction.emoji] = (counts[reaction.emoji] ?? 0) + 1;
        return counts;
      }, {});
    },
  });
}

export function useNoticeRead(noticeId?: string) {
  const uid = useAuthStore((s) => s.session?.user.id);

  return useQuery({
    queryKey: ['notice-reads', noticeId, uid],
    enabled: !!noticeId && !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notice_reads')
        .select('*')
        .eq('notice_id', noticeId!)
        .eq('profile_id', uid!)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
}

export function useAddNoticeReaction(noticeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (emoji: string) => {
      const uid = useAuthStore.getState().session?.user.id;
      if (!uid) throw new Error('Sign in required');

      const { error } = await supabase.from('notice_reactions').upsert({
        emoji,
        notice_id: noticeId,
        profile_id: uid,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notice-reactions', noticeId] }),
  });
}

export function useMarkNoticeRead(noticeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const uid = useAuthStore.getState().session?.user.id;
      if (!uid) throw new Error('Sign in required');

      const { error } = await supabase.from('notice_reads').upsert({
        notice_id: noticeId,
        profile_id: uid,
        read_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notice-reads', noticeId] }),
  });
}
