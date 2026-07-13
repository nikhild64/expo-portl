import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { Tables } from '@/types/database';

type PollVote = Tables<'poll_votes'>;

export function usePolls(societyId?: string | null, filter: 'active' | 'closed' = 'active') {
  return useQuery({
    queryKey: ['polls', societyId, filter],
    enabled: !!societyId,
    queryFn: async () => {
      const now = new Date().toISOString();
      let query = supabase.from('polls').select('*').eq('society_id', societyId!);
      query = filter === 'active' ? query.gte('ends_at', now) : query.lt('ends_at', now);
      const { data, error } = await query.order('ends_at', { ascending: filter === 'active' });
      if (error) throw error;
      return data;
    },
  });
}

export function usePoll(id?: string) {
  return useQuery({
    queryKey: ['polls', 'detail', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('polls').select('*').eq('id', id!).single();
      if (error) throw error;
      return data;
    },
  });
}

export function usePollVotes(pollId?: string) {
  return useQuery({
    queryKey: ['poll-votes', pollId],
    enabled: !!pollId,
    queryFn: async () => {
      const { data, error } = await supabase.from('poll_votes').select('*').eq('poll_id', pollId!);
      if (error) throw error;
      return data;
    },
  });
}

export function useMyPollVote(pollId?: string) {
  const uid = useAuthStore((s) => s.session?.user.id);

  return useQuery({
    queryKey: ['poll-votes', pollId, uid],
    enabled: !!pollId && !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('poll_votes')
        .select('*')
        .eq('poll_id', pollId!)
        .eq('profile_id', uid!)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
}

export function useVotePoll(pollId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (optionIndices: number[]) => {
      const uid = useAuthStore.getState().session?.user.id;
      if (!uid) throw new Error('Sign in required');

      const { error } = await supabase.from('poll_votes').upsert({
        option_indices: optionIndices,
        poll_id: pollId,
        profile_id: uid,
        voted_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onMutate: async (optionIndices) => {
      const uid = useAuthStore.getState().session?.user.id;
      if (!uid) return undefined;

      await queryClient.cancelQueries({ queryKey: ['poll-votes', pollId] });
      await queryClient.cancelQueries({ queryKey: ['poll-votes', pollId, uid] });

      const previousVotes = queryClient.getQueryData<PollVote[]>(['poll-votes', pollId]);
      const previousMyVote = queryClient.getQueryData<PollVote | null>(['poll-votes', pollId, uid]);
      const votedAt = new Date().toISOString();
      const nextVote = {
        ...(previousMyVote ?? {}),
        option_indices: optionIndices,
        poll_id: pollId,
        profile_id: uid,
        voted_at: votedAt,
      } as PollVote;

      queryClient.setQueryData<PollVote[]>(['poll-votes', pollId], (old = []) => {
        const withoutMine = old.filter((vote) => vote.profile_id !== uid);
        return [...withoutMine, nextVote];
      });
      queryClient.setQueryData<PollVote>(['poll-votes', pollId, uid], nextVote);

      return { previousMyVote, previousVotes, uid };
    },
    onError: (_error, _variables, context) => {
      if (!context?.uid) return;
      queryClient.setQueryData(['poll-votes', pollId], context.previousVotes);
      queryClient.setQueryData(['poll-votes', pollId, context.uid], context.previousMyVote);
    },
    onSettled: (_data, _error, _variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['poll-votes', pollId] });
      if (context?.uid) queryClient.invalidateQueries({ queryKey: ['poll-votes', pollId, context.uid] });
      queryClient.invalidateQueries({ queryKey: ['polls', 'detail', pollId] });
    },
  });
}

export function usePollComments(pollId?: string) {
  return useQuery({
    queryKey: ['poll-comments', pollId],
    enabled: !!pollId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('poll_comments')
        .select('*')
        .eq('poll_id', pollId!)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}

export function useAddPollComment(pollId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: string) => {
      const uid = useAuthStore.getState().session?.user.id;
      if (!uid) throw new Error('Sign in required');

      const { error } = await supabase.from('poll_comments').insert({
        body,
        poll_id: pollId,
        profile_id: uid,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['poll-comments', pollId] }),
  });
}
