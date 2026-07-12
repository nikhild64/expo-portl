import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

type NoticeCategory = Tables<'notices'>['category'] | 'all' | 'pinned';

export function useNotices(societyId?: string | null, category: NoticeCategory = 'all') {
  return useQuery({
    queryKey: ['notices', societyId, category],
    enabled: !!societyId,
    queryFn: async () => {
      let query = supabase.from('notices').select('*').eq('society_id', societyId!);

      if (category === 'pinned') query = query.eq('pinned', true);
      else if (category !== 'all') query = query.eq('category', category);

      const { data, error } = await query.order('pinned', { ascending: false }).order('published_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useNotice(id?: string) {
  return useQuery({
    queryKey: ['notices', 'detail', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('notices').select('*').eq('id', id!).single();
      if (error) throw error;
      return data;
    },
  });
}
