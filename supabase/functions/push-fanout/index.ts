// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_BATCH_SIZE = 100;
const BODY_MAX = 140;

type ChannelId = 'visitor-approval' | 'notices' | 'polls' | 'complaints' | 'payments';

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  record: Record<string, any> | null;
  old_record: Record<string, any> | null;
}

interface Dispatch {
  profileIds: string[];
  title: string;
  body: string;
  route: string;
  channelId: ChannelId;
}

interface PushMessage {
  to: string;
  title: string;
  body: string;
  data: { url: string; notificationId?: string; channelId?: ChannelId };
  channelId: ChannelId;
  priority: 'default' | 'high';
}

function truncate(value: string | null | undefined, max = BODY_MAX): string {
  if (!value) return '';
  return value.length > max ? `${value.slice(0, max - 1)}\u2026` : value;
}

function unique<T>(values: (T | null | undefined)[]): T[] {
  return [...new Set(values.filter((v): v is T => v !== null && v !== undefined))];
}

function titleize(value: string | null | undefined): string {
  if (!value) return '';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

async function residentsForFlat(supabase: SupabaseClient, flatId: string): Promise<string[]> {
  const { data, error } = await supabase.from('flat_residents').select('profile_id').eq('flat_id', flatId);
  if (error) {
    console.error('flat_residents lookup failed', error);
    return [];
  }
  return unique(data?.map((r) => r.profile_id));
}

async function adminsForSociety(supabase: SupabaseClient, societyId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('society_id', societyId)
    .eq('role', 'admin')
    .eq('status', 'active');
  if (error) {
    console.error('admin lookup failed', error);
    return [];
  }
  return unique(data?.map((p) => p.id));
}

async function audienceForNotice(supabase: SupabaseClient, record: any): Promise<string[]> {
  const audience = record.target_audience ?? { kind: 'all' };
  const kind = audience?.kind ?? 'all';

  if (kind === 'all') {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('society_id', record.society_id)
      .eq('status', 'active');
    return unique(data?.map((p) => p.id));
  }

  if (kind === 'towers' && Array.isArray(audience.ids) && audience.ids.length) {
    const { data } = await supabase
      .from('flat_residents')
      .select('profile_id, flats!inner(tower_id)')
      .in('flats.tower_id', audience.ids);
    return unique((data as any[])?.map((r) => r.profile_id));
  }

  if (kind === 'flats' && Array.isArray(audience.ids) && audience.ids.length) {
    const { data } = await supabase
      .from('flat_residents')
      .select('profile_id')
      .in('flat_id', audience.ids);
    return unique(data?.map((r) => r.profile_id));
  }

  if (kind === 'roles' && Array.isArray(audience.roles) && audience.roles.length) {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('society_id', record.society_id)
      .eq('status', 'active')
      .in('role', audience.roles);
    return unique(data?.map((p) => p.id));
  }

  return [];
}

async function resolveDispatches(
  supabase: SupabaseClient,
  payload: WebhookPayload,
): Promise<Dispatch[]> {
  const { table, type, record, old_record } = payload;
  const dispatches: Dispatch[] = [];

  // --- Visitors ---------------------------------------------------------
  if (table === 'visitors' && type === 'INSERT' && record?.status === 'pending' && !record?.pre_approved) {
    const profileIds = await residentsForFlat(supabase, record.flat_id);
    dispatches.push({
      profileIds,
      title: `${record.visitor_name} at the gate`,
      body: record.purpose ? `Purpose: ${record.purpose}` : titleize(record.type),
      route: `/(resident)/(approvals)/${record.id}`,
      channelId: 'visitor-approval',
    });
  }

  if (
    table === 'visitors' &&
    type === 'UPDATE' &&
    record &&
    old_record &&
    old_record.status === 'pending' &&
    (record.status === 'approved' || record.status === 'rejected')
  ) {
    if (record.guard_id) {
      dispatches.push({
        profileIds: [record.guard_id],
        title: `Visitor ${record.status}`,
        body: `${record.visitor_name} was ${record.status} by the resident.`,
        route: record.status === 'approved'
          ? `/(guard)/(add)/waiting/${record.id}`
          : `/(guard)/(log)`,
        channelId: 'visitor-approval',
      });
    }
  }

  // --- Notices ----------------------------------------------------------
  if (table === 'notices' && type === 'INSERT' && record) {
    const profileIds = await audienceForNotice(supabase, record);
    dispatches.push({
      profileIds,
      title: record.pinned ? `Pinned: ${record.title}` : record.title,
      body: truncate(record.body),
      route: `/(resident)/(community)/notices/${record.id}`,
      channelId: 'notices',
    });
  }

  // --- Complaints -------------------------------------------------------
  if (table === 'complaints' && type === 'INSERT' && record) {
    const profileIds = await adminsForSociety(supabase, record.society_id);
    dispatches.push({
      profileIds,
      title: `New ${record.priority ?? 'medium'}-priority complaint`,
      body: truncate(record.title),
      route: `/(admin)/(ops)/complaints/${record.id}`,
      channelId: 'complaints',
    });
  }

  if (
    table === 'complaints' &&
    type === 'UPDATE' &&
    record &&
    old_record &&
    (record.status !== old_record.status || record.assigned_to !== old_record.assigned_to)
  ) {
    const targets = unique([record.raised_by, record.assigned_to]);
    if (targets.length) {
      dispatches.push({
        profileIds: targets,
        title: `Complaint ${titleize(record.status)}`,
        body: truncate(record.title),
        route: `/(resident)/(menu)/complaints/${record.id}`,
        channelId: 'complaints',
      });
    }
  }

  // --- Complaint updates -----------------------------------------------
  if (table === 'complaint_updates' && type === 'INSERT' && record) {
    const { data: complaint } = await supabase
      .from('complaints')
      .select('raised_by, assigned_to, title')
      .eq('id', record.complaint_id)
      .single();
    if (complaint) {
      const targets = unique(
        [complaint.raised_by, complaint.assigned_to].filter((id) => id && id !== record.profile_id),
      );
      if (targets.length) {
        dispatches.push({
          profileIds: targets,
          title: `New comment on: ${truncate(complaint.title, 40)}`,
          body: truncate(record.body),
          route: `/(resident)/(menu)/complaints/${record.complaint_id}`,
          channelId: 'complaints',
        });
      }
    }
  }

  // --- Dues -------------------------------------------------------------
  if (table === 'dues' && type === 'INSERT' && record) {
    const profileIds = await residentsForFlat(supabase, record.flat_id);
    const period = record.period
      ? new Date(record.period).toLocaleString('en-IN', { month: 'long', year: 'numeric' })
      : 'this cycle';
    dispatches.push({
      profileIds,
      title: `Dues for ${period}`,
      body: `Amount \u20B9${record.total} \u2022 Due ${record.due_date}`,
      route: `/(resident)/(payments)`,
      channelId: 'payments',
    });
  }

  return dispatches;
}

async function sendExpoPush(messages: PushMessage[]): Promise<void> {
  for (let i = 0; i < messages.length; i += EXPO_BATCH_SIZE) {
    const chunk = messages.slice(i, i + EXPO_BATCH_SIZE);
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
        body: JSON.stringify(chunk),
      });
      if (!res.ok) {
        console.error('expo push failed', res.status, await res.text());
      }
    } catch (error) {
      console.error('expo push threw', error);
    }
  }
}

async function persistAndPush(supabase: SupabaseClient, dispatch: Dispatch): Promise<void> {
  const targets = unique(dispatch.profileIds);
  if (!targets.length) return;

  const rows = targets.map((profileId) => ({
    profile_id: profileId,
    category: dispatch.channelId,
    title: dispatch.title,
    body: dispatch.body,
    data: { url: dispatch.route },
  }));

  const { data: inserted, error: insertError } = await supabase
    .from('notifications')
    .insert(rows)
    .select('id, profile_id');
  if (insertError) {
    console.error('notifications insert failed', insertError);
  }

  const idByProfile = new Map<string, string>();
  for (const row of inserted ?? []) idByProfile.set(row.profile_id, row.id);

  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('expo_token, profile_id')
    .in('profile_id', targets)
    .eq('active', true);

  if (!tokens?.length) return;

  const priority: 'default' | 'high' =
    dispatch.channelId === 'visitor-approval' ||
    dispatch.channelId === 'complaints' ||
    dispatch.channelId === 'payments'
      ? 'high'
      : 'default';

  const messages: PushMessage[] = tokens.map((row) => ({
    to: row.expo_token,
    title: dispatch.title,
    body: dispatch.body,
    channelId: dispatch.channelId,
    priority,
    data: {
      url: dispatch.route,
      notificationId: idByProfile.get(row.profile_id),
      channelId: dispatch.channelId,
    },
  }));

  await sendExpoPush(messages);
}

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const authHeader = req.headers.get('Authorization');
  const expected = Deno.env.get('PUSH_FANOUT_SECRET');
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  let payload: WebhookPayload;
  try {
    payload = (await req.json()) as WebhookPayload;
  } catch {
    return new Response('invalid json', { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  try {
    const dispatches = await resolveDispatches(supabase, payload);
    for (const dispatch of dispatches) await persistAndPush(supabase, dispatch);
    return new Response(JSON.stringify({ ok: true, dispatches: dispatches.length }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('push-fanout error', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
