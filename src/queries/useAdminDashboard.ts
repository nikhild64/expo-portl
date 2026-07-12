import { useQuery } from '@tanstack/react-query';

import { endOfTodayIso, startOfTodayIso } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

export type AdminActivityItem = {
  id: string;
  title: string;
  subtitle: string;
  createdAt: string;
  type: 'visitor' | 'complaint' | 'booking' | 'notice';
};

function previousDayRange() {
  const start = new Date();
  start.setDate(start.getDate() - 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

function startOfMonthIso(month: Date) {
  return new Date(month.getFullYear(), month.getMonth(), 1).toISOString().slice(0, 10);
}

function endOfMonthIso(month: Date) {
  return new Date(month.getFullYear(), month.getMonth() + 1, 0).toISOString().slice(0, 10);
}

export function useTodayVisitorsKpi(societyId?: string | null) {
  return useQuery({
    queryKey: ['admin-dashboard', 'visitors-kpi', societyId],
    enabled: !!societyId,
    queryFn: async () => {
      const yesterday = previousDayRange();
      const [today, previous, recent] = await Promise.all([
        supabase
          .from('visitors')
          .select('id', { count: 'exact', head: true })
          .eq('society_id', societyId!)
          .gte('requested_at', startOfTodayIso())
          .lte('requested_at', endOfTodayIso()),
        supabase
          .from('visitors')
          .select('id', { count: 'exact', head: true })
          .eq('society_id', societyId!)
          .gte('requested_at', yesterday.start)
          .lte('requested_at', yesterday.end),
        supabase
          .from('visitors')
          .select('requested_at')
          .eq('society_id', societyId!)
          .gte('requested_at', new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString())
          .order('requested_at'),
      ]);
      if (today.error) throw today.error;
      if (previous.error) throw previous.error;
      if (recent.error) throw recent.error;

      const buckets = Array.from({ length: 7 }, () => 0);
      recent.data?.forEach((row) => {
        const diff = Math.max(0, Math.min(6, Math.floor((Date.now() - new Date(row.requested_at).getTime()) / (24 * 60 * 60 * 1000))));
        buckets[6 - diff] += 1;
      });

      return { count: today.count ?? 0, previous: previous.count ?? 0, trend: buckets };
    },
  });
}

export function useOpenComplaintsKpi(societyId?: string | null) {
  return useQuery({
    queryKey: ['admin-dashboard', 'complaints-kpi', societyId],
    enabled: !!societyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('complaints')
        .select('priority')
        .eq('society_id', societyId!)
        .in('status', ['new', 'assigned', 'in_progress']);
      if (error) throw error;
      const breakdown = { low: 0, medium: 0, high: 0, urgent: 0 };
      data.forEach((row) => {
        breakdown[row.priority] += 1;
      });
      return { count: data.length, breakdown };
    },
  });
}

export function useDuesCollectedKpi(societyId?: string | null, month = new Date()) {
  return useQuery({
    queryKey: ['admin-dashboard', 'dues-kpi', societyId, month.getFullYear(), month.getMonth()],
    enabled: !!societyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dues')
        .select('total,status')
        .eq('society_id', societyId!)
        .gte('period', startOfMonthIso(month))
        .lte('period', endOfMonthIso(month));
      if (error) throw error;
      const total = data.reduce((sum, due) => sum + Number(due.total), 0);
      const collected = data.filter((due) => due.status === 'paid').reduce((sum, due) => sum + Number(due.total), 0);
      return { collected, total, percent: total ? Math.round((collected / total) * 100) : 0 };
    },
  });
}

export function useAmenityUsageKpi(societyId?: string | null, days = 7) {
  return useQuery({
    queryKey: ['admin-dashboard', 'amenities-kpi', societyId, days],
    enabled: !!societyId,
    queryFn: async () => {
      const from = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000);
      from.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from('amenity_bookings')
        .select('start_at, amenities!inner(society_id)')
        .eq('amenities.society_id', societyId!)
        .gte('start_at', from.toISOString())
        .in('status', ['confirmed', 'completed']);
      if (error) throw error;
      const buckets = Array.from({ length: days }, (_, index) => ({ day: index, count: 0 }));
      data.forEach((booking) => {
        const diff = Math.floor((new Date(booking.start_at).getTime() - from.getTime()) / (24 * 60 * 60 * 1000));
        if (buckets[diff]) buckets[diff].count += 1;
      });
      const max = Math.max(1, ...buckets.map((bucket) => bucket.count));
      return buckets.map((bucket) => ({ ...bucket, percent: Math.round((bucket.count / max) * 100) }));
    },
  });
}

export function usePendingJoinRequests(societyId?: string | null) {
  return useQuery({
    queryKey: ['admin-dashboard', 'pending-joins', societyId],
    enabled: !!societyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('society_id', societyId!)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Tables<'profiles'>[];
    },
  });
}

export function useAdminActivity(societyId?: string | null) {
  return useQuery({
    queryKey: ['admin-dashboard', 'activity', societyId],
    enabled: !!societyId,
    queryFn: async () => {
      const [visitors, complaints, bookings, notices] = await Promise.all([
        supabase.from('visitors').select('id, visitor_name, status, requested_at').eq('society_id', societyId!).order('requested_at', { ascending: false }).limit(5),
        supabase.from('complaints').select('id, title, status, created_at').eq('society_id', societyId!).order('created_at', { ascending: false }).limit(5),
        supabase
          .from('amenity_bookings')
          .select('id, start_at, status, amenities!inner(name, society_id)')
          .eq('amenities.society_id', societyId!)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase.from('notices').select('id, title, category, published_at').eq('society_id', societyId!).order('published_at', { ascending: false }).limit(5),
      ]);
      for (const result of [visitors, complaints, bookings, notices]) {
        if (result.error) throw result.error;
      }

      return [
        ...(visitors.data ?? []).map((row): AdminActivityItem => ({
          id: row.id,
          title: row.visitor_name,
          subtitle: `Visitor ${row.status}`,
          createdAt: row.requested_at,
          type: 'visitor',
        })),
        ...(complaints.data ?? []).map((row): AdminActivityItem => ({
          id: row.id,
          title: row.title,
          subtitle: `Complaint ${row.status}`,
          createdAt: row.created_at,
          type: 'complaint',
        })),
        ...(bookings.data ?? []).map((row): AdminActivityItem => ({
          id: row.id,
          title: row.amenities?.name ?? 'Amenity booking',
          subtitle: `Booking ${row.status}`,
          createdAt: row.start_at,
          type: 'booking',
        })),
        ...(notices.data ?? []).map((row): AdminActivityItem => ({
          id: row.id,
          title: row.title,
          subtitle: `Notice ${row.category}`,
          createdAt: row.published_at,
          type: 'notice',
        })),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 12);
    },
  });
}
