import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { Tables } from '@/types/database';

type NoticeReaction = Tables<'notice_reactions'>;

export function useNoticeReactions(noticeId?: string) {
  return useQuery({
    queryKey: ['notice-reactions', noticeId],
    enabled: !!noticeId,
    queryFn: async () => {
      if (!noticeId) return {};

      const { data, error } = await supabase.from('notice_reactions').select('*').eq('notice_id', noticeId);
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
      if (!noticeId || !uid) return null;

      const { data, error } = await supabase
        .from('notice_reads')
        .select('*')
        .eq('notice_id', noticeId)
        .eq('profile_id', uid)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
}

export function useMyNoticeReaction(noticeId?: string) {
  const uid = useAuthStore((s) => s.session?.user.id);

  return useQuery({
    queryKey: ['notice-reactions', noticeId, 'mine', uid],
    enabled: !!noticeId && !!uid,
    queryFn: async () => {
      if (!noticeId || !uid) return null;

      const { data, error } = await supabase
        .from('notice_reactions')
        .select('*')
        .eq('notice_id', noticeId)
        .eq('profile_id', uid)
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

      const { error } = await supabase.from('notice_reactions').upsert(
        {
          emoji,
          notice_id: noticeId,
          profile_id: uid,
        },
        { onConflict: 'notice_id,profile_id' },
      );
      if (error) throw error;
    },
    onMutate: async (emoji) => {
      const uid = useAuthStore.getState().session?.user.id;
      await queryClient.cancelQueries({ queryKey: ['notice-reactions', noticeId] });
      if (uid) await queryClient.cancelQueries({ queryKey: ['notice-reactions', noticeId, 'mine', uid] });

      const previous = queryClient.getQueryData<Record<string, number>>(['notice-reactions', noticeId]);
      const previousMine = uid
        ? queryClient.getQueryData<NoticeReaction | null>(['notice-reactions', noticeId, 'mine', uid])
        : null;

      queryClient.setQueryData<Record<string, number>>(['notice-reactions', noticeId], (old = {}) => {
        const next = { ...old };
        if (previousMine?.emoji && previousMine.emoji !== emoji) {
          const previousCount = next[previousMine.emoji] ?? 0;
          if (previousCount <= 1) delete next[previousMine.emoji];
          else next[previousMine.emoji] = previousCount - 1;
        }
        if (previousMine?.emoji !== emoji) {
          next[emoji] = (next[emoji] ?? 0) + 1;
        }
        return next;
      });

      if (uid) {
        queryClient.setQueryData<NoticeReaction>(['notice-reactions', noticeId, 'mine', uid], {
          emoji,
          notice_id: noticeId,
          profile_id: uid,
        });
      }

      return { previous, previousMine, uid };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(['notice-reactions', noticeId], context?.previous);
      if (context?.uid) {
        queryClient.setQueryData(['notice-reactions', noticeId, 'mine', context.uid], context?.previousMine);
      }
    },
  });
}

export function useRemoveNoticeReaction(noticeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const uid = useAuthStore.getState().session?.user.id;
      if (!uid) throw new Error('Sign in required');

      const { error } = await supabase
        .from('notice_reactions')
        .delete()
        .eq('notice_id', noticeId)
        .eq('profile_id', uid);
      if (error) throw error;
    },
    onMutate: async () => {
      const uid = useAuthStore.getState().session?.user.id;
      await queryClient.cancelQueries({ queryKey: ['notice-reactions', noticeId] });
      if (uid) await queryClient.cancelQueries({ queryKey: ['notice-reactions', noticeId, 'mine', uid] });

      const previous = queryClient.getQueryData<Record<string, number>>(['notice-reactions', noticeId]);
      const previousMine = uid
        ? queryClient.getQueryData<NoticeReaction | null>(['notice-reactions', noticeId, 'mine', uid])
        : null;

      if (previousMine?.emoji) {
        queryClient.setQueryData<Record<string, number>>(['notice-reactions', noticeId], (old = {}) => {
          const next = { ...old };
          const previousCount = next[previousMine.emoji] ?? 0;
          if (previousCount <= 1) delete next[previousMine.emoji];
          else next[previousMine.emoji] = previousCount - 1;
          return next;
        });
      }

      if (uid) queryClient.setQueryData(['notice-reactions', noticeId, 'mine', uid], null);

      return { previous, previousMine, uid };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(['notice-reactions', noticeId], context?.previous);
      if (context?.uid) {
        queryClient.setQueryData(['notice-reactions', noticeId, 'mine', context.uid], context?.previousMine);
      }
    },
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
