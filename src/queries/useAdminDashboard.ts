import { useQuery } from '@tanstack/react-query';

import { endOfMonthDate, endOfTodayIso, startOfMonthDate, startOfTodayIso } from '@/lib/format';
import { supabase } from '@/lib/supabase';

export type AdminActivityItem = {
  id: string;
  title: string;
  subtitle: string;
  createdAt: string;
  type: 'visitor' | 'complaint' | 'booking' | 'notice';
  amenityId?: string;
};

function previousDayRange() {
  const start = new Date();
  start.setDate(start.getDate() - 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

function dayRange(daysAgo: number) {
  const start = new Date();
  start.setDate(start.getDate() - daysAgo);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function useTodayVisitorsKpi(societyId?: string | null) {
  return useQuery({
    queryKey: ['admin-dashboard', 'visitors-kpi', societyId],
    enabled: !!societyId,
    queryFn: async () => {
      if (!societyId) {
        return { count: 0, previous: 0, trend: [0, 0, 0, 0, 0, 0, 0] };
      }

      const dayRanges = Array.from({ length: 7 }, (_, index) => dayRange(6 - index));
      const rangeStart = dayRanges[0]?.start;
      if (!rangeStart) {
        return { count: 0, previous: 0, trend: [0, 0, 0, 0, 0, 0, 0] };
      }

      const { data, error } = await supabase
        .from('visitors')
        .select('requested_at')
        .eq('society_id', societyId)
        .gte('requested_at', rangeStart)
        .lte('requested_at', endOfTodayIso());

      if (error) throw error;

      const trend = dayRanges.map(() => 0);
      const todayStart = startOfTodayIso();
      const todayEnd = endOfTodayIso();
      const yesterday = previousDayRange();
      let count = 0;
      let previous = 0;

      for (const row of data ?? []) {
        const requestedAt = row.requested_at;
        if (!requestedAt) continue;
        if (requestedAt >= todayStart && requestedAt <= todayEnd) count += 1;
        if (requestedAt >= yesterday.start && requestedAt <= yesterday.end) previous += 1;
        for (let index = 0; index < dayRanges.length; index += 1) {
          const range = dayRanges[index];
          if (requestedAt >= range.start && requestedAt <= range.end) {
            trend[index] += 1;
            break;
          }
        }
      }

      return { count, previous, trend };
    },
  });
}

export function useOpenComplaintsKpi(societyId?: string | null) {
  return useQuery({
    queryKey: ['admin-dashboard', 'complaints-kpi', societyId],
    enabled: !!societyId,
    queryFn: async () => {
      if (!societyId) return { count: 0, breakdown: { low: 0, medium: 0, high: 0, urgent: 0 } };

      const { data, error } = await supabase
        .from('complaints')
        .select('priority')
        .eq('society_id', societyId)
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
      if (!societyId) return { collected: 0, total: 0, percent: 0 };

      const { data, error } = await supabase
        .from('dues')
        .select('total,status')
        .eq('society_id', societyId)
        .gte('period', startOfMonthDate(month))
        .lte('period', endOfMonthDate(month));
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
      if (!societyId) return Array.from({ length: days }, (_, index) => ({ day: index, count: 0, percent: 0 }));

      const from = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000);
      from.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from('amenity_bookings')
        .select('start_at, amenities!inner(society_id)')
        .eq('amenities.society_id', societyId)
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
      if (!societyId) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('society_id', societyId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAdminActivity(societyId?: string | null) {
  return useQuery({
    queryKey: ['admin-dashboard', 'activity', societyId],
    enabled: !!societyId,
    queryFn: async () => {
      if (!societyId) return [];

      const society = societyId;
      const [visitors, complaints, bookings, notices] = await Promise.all([
        supabase.from('visitors').select('id, visitor_name, status, requested_at').eq('society_id', society).order('requested_at', { ascending: false }).limit(5),
        supabase.from('complaints').select('id, title, status, created_at').eq('society_id', society).order('created_at', { ascending: false }).limit(5),
        supabase
          .from('amenity_bookings')
          .select('id, amenity_id, start_at, status, amenities!inner(name, society_id)')
          .eq('amenities.society_id', society)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase.from('notices').select('id, title, category, published_at').eq('society_id', society).order('published_at', { ascending: false }).limit(5),
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
          amenityId: row.amenity_id,
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
