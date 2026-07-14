import {
  type InfiniteData,
  type QueryClient,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import {
  ACTIVE_STATUSES,
  type ComplaintCategoryFilter,
  type ComplaintScope,
  type ComplaintStatusFilter,
  RESOLVED_STATUSES,
} from '@/features/complaints/constants';
import { startOfCurrentMonthIso } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import {
  complaintDetailSelect,
  complaintListSelect,
  complaintUpdatesSelect,
  type ComplaintDetail,
  type ComplaintUpdateWithProfile,
  type ComplaintWithFlat,
} from '@/queries/supabaseSelects';
import { useAuthStore } from '@/stores/authStore';
import type { Tables, TablesInsert } from '@/types/database';

export type { ComplaintDetail, ComplaintUpdateWithProfile, ComplaintWithFlat };

type Complaint = Tables<'complaints'>;

export type ComplaintCounts = {
  active: number;
  all: number;
  resolved: number;
  resolvedThisMonth: number;
};

function applyStatusFilter<T extends { in: (column: string, values: string[]) => T }>(
  query: T,
  filter: ComplaintStatusFilter,
) {
  if (filter === 'active') return query.in('status', [...ACTIVE_STATUSES]);
  if (filter === 'resolved') return query.in('status', [...RESOLVED_STATUSES]);
  return query;
}

function applyCategoryFilter<T extends { eq: (column: string, value: string) => T }>(
  query: T,
  category?: ComplaintCategoryFilter,
) {
  if (!category || category === 'all') return query;
  return query.eq('category', category);
}

const COMPLAINT_COUNT_STALE_MS = 5 * 60 * 1000;

function scopedComplaintRows(scope: ComplaintScope, uid?: string, societyId?: string) {
  let query = supabase.from('complaints').select('status, resolved_at');
  if (scope === 'mine') {
    if (!uid) throw new Error('User required');
    query = query.eq('raised_by', uid);
  } else {
    if (!societyId) throw new Error('Society required');
    query = query.eq('society_id', societyId);
  }
  return query;
}

export function useComplaintCounts(scope: ComplaintScope, societyId?: string | null) {
  const uid = useAuthStore((s) => s.session?.user.id);

  return useQuery({
    queryKey: ['complaint-counts', scope, uid, societyId],
    enabled: scope === 'mine' ? !!uid : !!societyId,
    staleTime: COMPLAINT_COUNT_STALE_MS,
    queryFn: async () => {
      const monthStart = startOfCurrentMonthIso();
      const { data, error } = await scopedComplaintRows(scope, uid, societyId ?? undefined);
      if (error) throw error;

      let all = 0;
      let active = 0;
      let resolved = 0;
      let resolvedThisMonth = 0;

      for (const row of data ?? []) {
        all += 1;
        if ((ACTIVE_STATUSES as readonly string[]).includes(row.status)) active += 1;
        if ((RESOLVED_STATUSES as readonly string[]).includes(row.status)) {
          resolved += 1;
          if (row.resolved_at && row.resolved_at >= monthStart) resolvedThisMonth += 1;
        }
      }

      return { all, active, resolved, resolvedThisMonth };
    },
  });
}

interface ComplaintsListOptions {
  scope: ComplaintScope;
  statusFilter?: ComplaintStatusFilter;
  category?: ComplaintCategoryFilter;
  societyId?: string | null;
}

export const COMPLAINTS_PAGE_SIZE = 25;

type ComplaintsPage = {
  items: ComplaintWithFlat[];
  nextPage: number | undefined;
};

export function flattenComplaintPages(pages: ComplaintsPage[] | undefined) {
  return pages?.flatMap((page) => page.items) ?? [];
}

function isComplaintsListQueryKey(key: readonly unknown[]): boolean {
  return key[0] === 'complaints' && key[1] !== 'detail' && key.length > 2;
}

function patchComplaintInListCaches(
  queryClient: QueryClient,
  id: string,
  patch: Partial<Complaint>,
) {
  queryClient.setQueriesData<InfiniteData<ComplaintsPage>>(
    { predicate: (query) => isComplaintsListQueryKey(query.queryKey) },
    (old) => {
      if (!old?.pages) return old;
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          items: page.items.map((complaint) =>
            complaint.id === id ? { ...complaint, ...patch } : complaint,
          ),
        })),
      };
    },
  );
}

export function useComplaints({
  scope,
  statusFilter = 'active',
  category = 'all',
  societyId,
}: ComplaintsListOptions) {
  const uid = useAuthStore((s) => s.session?.user.id);

  return useInfiniteQuery({
    queryKey: ['complaints', scope, statusFilter, category, uid, societyId],
    enabled: scope === 'mine' ? !!uid : !!societyId,
    initialPageParam: 0,
    queryFn: async ({ pageParam }): Promise<ComplaintsPage> => {
      const page = pageParam as number;
      const from = page * COMPLAINTS_PAGE_SIZE;
      const to = from + COMPLAINTS_PAGE_SIZE - 1;

      let query = complaintListSelect().order('created_at', { ascending: false });

      if (scope === 'mine') {
        if (!uid) return { items: [], nextPage: undefined };
        query = query.eq('raised_by', uid);
      } else {
        if (!societyId) return { items: [], nextPage: undefined };
        query = query.eq('society_id', societyId);
      }

      query = applyStatusFilter(query, statusFilter);
      query = applyCategoryFilter(query, category);

      const { data, error } = await query.range(from, to);
      if (error) throw error;

      const items = data ?? [];
      return { items, nextPage: items.length === COMPLAINTS_PAGE_SIZE ? page + 1 : undefined };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });
}

export function useComplaint(id?: string) {
  return useQuery({
    queryKey: ['complaints', 'detail', id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) throw new Error('Complaint id required');

      const { data, error } = await complaintDetailSelect(id);
      if (error) throw error;
      return data;
    },
  });
}

export function useComplaintUpdates(complaintId?: string) {
  return useQuery({
    queryKey: ['complaint-updates', complaintId],
    enabled: !!complaintId,
    queryFn: async () => {
      if (!complaintId) return [];

      const { data, error } = await complaintUpdatesSelect(complaintId);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateComplaint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TablesInsert<'complaints'>) => {
      const { data, error } = await supabase.from('complaints').insert(input).select('*').single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['complaints', 'detail', data.id], data);
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      queryClient.invalidateQueries({ queryKey: ['complaint-counts'] });
    },
  });
}

export function useAddComplaintComment(complaintId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: string) => {
      const uid = useAuthStore.getState().session?.user.id;
      if (!uid) throw new Error('Sign in required');

      const { error } = await supabase.from('complaint_updates').insert({
        body,
        complaint_id: complaintId,
        kind: 'comment',
        profile_id: uid,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['complaint-updates', complaintId] }),
  });
}

export function useCloseComplaint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const resolvedAt = new Date().toISOString();
      const { data, error } = await supabase
        .from('complaints')
        .update({ resolved_at: resolvedAt, status: 'closed' })
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['complaints'] });
      await queryClient.cancelQueries({ queryKey: ['complaints', 'detail', id] });

      const previousLists = queryClient.getQueriesData<InfiniteData<ComplaintsPage>>({
        predicate: (query) => isComplaintsListQueryKey(query.queryKey),
      });
      const previousDetail = queryClient.getQueryData<ComplaintDetail>(['complaints', 'detail', id]);

      const resolvedAt = new Date().toISOString();
      const patch = { resolved_at: resolvedAt, status: 'closed' as const };
      patchComplaintInListCaches(queryClient, id, patch);
      queryClient.setQueryData<ComplaintDetail>(['complaints', 'detail', id], (old) =>
        old ? { ...old, ...patch } : old,
      );

      return { previousLists, previousDetail };
    },
    onError: (_error, id, context) => {
      context?.previousLists.forEach(([key, data]) => queryClient.setQueryData(key, data));
      if (context?.previousDetail) {
        queryClient.setQueryData(['complaints', 'detail', id], context.previousDetail);
      }
    },
    onSettled: (_data, _error, id) => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      queryClient.invalidateQueries({ queryKey: ['complaint-counts'] });
      queryClient.invalidateQueries({ queryKey: ['complaints', 'detail', id] });
    },
  });
}
