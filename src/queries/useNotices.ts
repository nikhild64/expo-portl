import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

type NoticeCategory = Tables<'notices'>['category'] | 'all' | 'pinned';

export const NOTICES_PAGE_SIZE = 25;

type NoticesPage = {
  items: Tables<'notices'>[];
  nextPage: number | undefined;
};

export function flattenNoticePages(pages: NoticesPage[] | undefined) {
  return pages?.flatMap((page) => page.items) ?? [];
}

export function useNotices(societyId?: string | null, category: NoticeCategory = 'all') {
  return useInfiniteQuery({
    queryKey: ['notices', societyId, category],
    enabled: !!societyId,
    initialPageParam: 0,
    queryFn: async ({ pageParam }): Promise<NoticesPage> => {
      if (!societyId) return { items: [], nextPage: undefined };

      const page = pageParam as number;
      const from = page * NOTICES_PAGE_SIZE;
      const to = from + NOTICES_PAGE_SIZE - 1;

      let query = supabase.from('notices').select('*').eq('society_id', societyId);

      if (category === 'pinned') query = query.eq('pinned', true);
      else if (category !== 'all') query = query.eq('category', category);

      const { data, error } = await query
        .order('pinned', { ascending: false })
        .order('published_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const items = data ?? [];
      return { items, nextPage: items.length === NOTICES_PAGE_SIZE ? page + 1 : undefined };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });
}

function noticeCountQuery(societyId: string) {
  return supabase.from('notices').select('category, pinned').eq('society_id', societyId);
}

const NOTICE_COUNT_STALE_MS = 5 * 60 * 1000;

export function useNoticeCounts(societyId?: string | null) {
  return useQuery({
    queryKey: ['notices', 'counts', societyId],
    enabled: !!societyId,
    staleTime: NOTICE_COUNT_STALE_MS,
    queryFn: async () => {
      if (!societyId) {
        return { all: 0, pinned: 0, event: 0, maintenance: 0, general: 0, emergency: 0 };
      }

      const { data, error } = await noticeCountQuery(societyId);
      if (error) throw error;

      const counts = { all: 0, pinned: 0, event: 0, maintenance: 0, general: 0, emergency: 0 };
      for (const row of data ?? []) {
        counts.all += 1;
        if (row.pinned) counts.pinned += 1;
        if (row.category in counts) {
          counts[row.category as keyof typeof counts] += 1;
        }
      }

      return counts;
    },
  });
}

export function useNotice(id?: string) {
  return useQuery({
    queryKey: ['notices', 'detail', id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) throw new Error('Notice id required');

      const { data, error } = await supabase.from('notices').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
  });
}
