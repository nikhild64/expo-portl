import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  ACTIVE_STATUSES,
  type ComplaintCategoryFilter,
  type ComplaintScope,
  type ComplaintStatusFilter,
  RESOLVED_STATUSES,
} from '@/features/complaints/constants';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { Tables, TablesInsert } from '@/types/database';

type Complaint = Tables<'complaints'>;

export type ComplaintWithFlat = Complaint & {
  flat?: { number: string; towers?: { name: string } | null } | null;
  raised_by_profile?: { full_name: string } | null;
};

export type ComplaintDetail = ComplaintWithFlat & {
  assigned?: { full_name: string; phone: string | null; avatar_url: string | null; role: string } | null;
  assigned_service_provider?: { name: string; phone: string | null; category: string } | null;
};

export type ComplaintUpdateWithProfile = Tables<'complaint_updates'> & {
  profile?: { full_name: string } | null;
};

export type ComplaintCounts = {
  active: number;
  all: number;
  resolved: number;
  resolvedThisMonth: number;
};

function startOfMonthIso() {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

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

function computeCounts(rows: { status: Complaint['status']; resolved_at: string | null }[]): ComplaintCounts {
  const monthStart = startOfMonthIso();
  const active = rows.filter((row) => ACTIVE_STATUSES.includes(row.status as (typeof ACTIVE_STATUSES)[number])).length;
  const resolved = rows.filter((row) => RESOLVED_STATUSES.includes(row.status as (typeof RESOLVED_STATUSES)[number])).length;
  const resolvedThisMonth = rows.filter(
    (row) =>
      RESOLVED_STATUSES.includes(row.status as (typeof RESOLVED_STATUSES)[number]) &&
      row.resolved_at &&
      row.resolved_at >= monthStart,
  ).length;

  return { active, all: rows.length, resolved, resolvedThisMonth };
}

export function useComplaintCounts(scope: ComplaintScope, societyId?: string | null) {
  const uid = useAuthStore((s) => s.session?.user.id);

  return useQuery({
    queryKey: ['complaint-counts', scope, uid, societyId],
    enabled: scope === 'mine' ? !!uid : !!societyId,
    queryFn: async () => {
      let query = supabase.from('complaints').select('status, resolved_at');
      if (scope === 'mine') query = query.eq('raised_by', uid!);
      else query = query.eq('society_id', societyId!);

      const { data, error } = await query;
      if (error) throw error;
      return computeCounts(data ?? []);
    },
  });
}

interface ComplaintsListOptions {
  scope: ComplaintScope;
  statusFilter?: ComplaintStatusFilter;
  category?: ComplaintCategoryFilter;
  societyId?: string | null;
}

export function useComplaints({
  scope,
  statusFilter = 'active',
  category = 'all',
  societyId,
}: ComplaintsListOptions) {
  const uid = useAuthStore((s) => s.session?.user.id);

  return useQuery({
    queryKey: ['complaints', scope, statusFilter, category, uid, societyId],
    enabled: scope === 'mine' ? !!uid : !!societyId,
    queryFn: async () => {
      let query = supabase
        .from('complaints')
        .select('*, flat:flats(number, towers(name))')
        .order('created_at', { ascending: false });

      if (scope === 'mine') query = query.eq('raised_by', uid!);
      else query = query.eq('society_id', societyId!);

      query = applyStatusFilter(query, statusFilter);
      query = applyCategoryFilter(query, category);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as ComplaintWithFlat[];
    },
  });
}

export function useComplaint(id?: string) {
  return useQuery({
    queryKey: ['complaints', 'detail', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('complaints')
        .select(
          '*, raised_by_profile:profiles!complaints_raised_by_fkey(full_name), flat:flats(number, towers(name)), assigned:profiles!complaints_assigned_to_fkey(full_name, phone, avatar_url, role), assigned_service_provider:service_providers!complaints_assigned_service_provider_id_fkey(name, phone, category)',
        )
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as ComplaintDetail;
    },
  });
}

export function useComplaintUpdates(complaintId?: string) {
  return useQuery({
    queryKey: ['complaint-updates', complaintId],
    enabled: !!complaintId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('complaint_updates')
        .select('*, profile:profiles(full_name)')
        .eq('complaint_id', complaintId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as ComplaintUpdateWithProfile[];
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
    onSuccess: () => {
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
  const closedAt = () => new Date().toISOString();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('complaints')
        .update({ resolved_at: closedAt(), status: 'closed' })
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['complaints'] });
      await queryClient.cancelQueries({ queryKey: ['complaints', 'detail', id] });

      const previousLists = queryClient.getQueriesData<Complaint[]>({ queryKey: ['complaints'] });
      const previousDetail = queryClient.getQueryData<Complaint>(['complaints', 'detail', id]);

      const patch = { resolved_at: closedAt(), status: 'closed' as const };
      queryClient.setQueriesData<Complaint[]>({ queryKey: ['complaints'] }, (old) =>
        old?.map((complaint) => (complaint.id === id ? { ...complaint, ...patch } : complaint)),
      );
      queryClient.setQueryData<Complaint>(['complaints', 'detail', id], (old) => (old ? { ...old, ...patch } : old));

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
