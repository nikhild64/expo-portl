// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  localizeNotification,
  normalizeLocale,
  type AppLocale,
  type NotificationTemplateId,
  type NotificationTemplateParams,
} from '../_shared/notificationI18n.ts';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_BATCH_SIZE = 100;
const BODY_MAX = 140;

type ChannelId = 'visitor-approval' | 'notices' | 'polls' | 'complaints' | 'payments';

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE' | 'PUSH';
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
  template?: NotificationTemplateId;
  params?: NotificationTemplateParams;
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

function formatDuesPeriod(value: string | null | undefined, locale: AppLocale): string {
  if (!value) return locale === 'hi' ? 'इस चक्र' : 'this cycle';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(locale === 'hi' ? 'hi-IN' : 'en-IN', { month: 'long', year: 'numeric' });
}

function localizedText(
  dispatch: Dispatch,
  locale: AppLocale,
): { title: string; body: string } {
  if (!dispatch.template) return { title: dispatch.title, body: dispatch.body };
  return localizeNotification(
    locale,
    dispatch.template,
    dispatch.params ?? {},
    { title: dispatch.title, body: dispatch.body },
  );
}

async function localesByProfileIds(
  supabase: SupabaseClient,
  profileIds: string[],
): Promise<Map<string, AppLocale>> {
  if (!profileIds.length) return new Map();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, preferred_locale')
    .in('id', profileIds);
  if (error) {
    console.error('preferred_locale lookup failed', error);
    return new Map(profileIds.map((id) => [id, 'en']));
  }
  return new Map(
    (data ?? []).map((row) => [row.id as string, normalizeLocale(row.preferred_locale as string)]),
  );
}

function titleize(value: string | null | undefined): string {
  if (!value) return '';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function fieldChanged(next: unknown, prev: unknown): boolean {
  return (next ?? null) !== (prev ?? null);
}

function excludeIds(profileIds: string[], ...exclude: (string | null | undefined)[]): string[] {
  const blocked = new Set(exclude.filter(Boolean));
  return profileIds.filter((id) => !blocked.has(id));
}

function defaultNotificationsRoute(role: string): string {
  if (role === 'admin') return '/(admin)/(dashboard)/notifications';
  if (role === 'guard') return '/(guard)/(home)/notifications';
  return '/(resident)/(home)/notifications';
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

async function profilesByIds(
  supabase: SupabaseClient,
  profileIds: string[],
): Promise<{ id: string; role: string }[]> {
  if (!profileIds.length) return [];
  const { data, error } = await supabase.from('profiles').select('id, role').in('id', profileIds);
  if (error) {
    console.error('profiles lookup failed', error);
    return [];
  }
  return data ?? [];
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
      route: `/(resident)/(home)/approvals/${record.id}`,
      channelId: 'visitor-approval',
      template: 'visitorAtGate',
      params: {
        visitorName: record.visitor_name,
        purpose: record.purpose ?? undefined,
        visitorType: titleize(record.type),
      },
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
        template: 'visitorStatusChanged',
        params: {
          visitorName: record.visitor_name,
          status: record.status,
        },
      });
    }
  }

  // --- Notices ----------------------------------------------------------
  if (table === 'notices' && type === 'INSERT' && record) {
    const profileIds = excludeIds(await audienceForNotice(supabase, record), record.created_by);
    const residentIds = (await profilesByIds(supabase, profileIds))
      .filter((profile) => profile.role === 'resident')
      .map((profile) => profile.id);

    if (residentIds.length) {
      const title = record.pinned ? `Pinned: ${record.title}` : record.title;
      const body = truncate(record.body);
      dispatches.push({
        profileIds: residentIds,
        title,
        body,
        route: `/(resident)/(community)/notices/${record.id}`,
        channelId: 'notices',
      });
    }
  }

  // --- Polls ------------------------------------------------------------
  if (table === 'polls' && type === 'INSERT' && record) {
    const profileIds = excludeIds(await audienceForNotice(supabase, record), record.created_by);
    const residentIds = (await profilesByIds(supabase, profileIds))
      .filter((profile) => profile.role === 'resident')
      .map((profile) => profile.id);

    if (residentIds.length) {
      dispatches.push({
        profileIds: residentIds,
        title: `New poll: ${truncate(record.question, 60)}`,
        body: 'Cast your vote in the community tab.',
        route: `/(resident)/(community)/polls/${record.id}`,
        channelId: 'polls',
        template: 'pollPublished',
        params: {
          question: truncate(record.question, 80),
          category: titleize(record.category),
        },
      });
    }
  }

  // --- Complaints -------------------------------------------------------
  if (table === 'complaints' && type === 'INSERT' && record) {
    const profileIds = excludeIds(
      await adminsForSociety(supabase, record.society_id),
      record.raised_by,
    );
    if (profileIds.length) {
      dispatches.push({
        profileIds,
        title: `New ${record.priority ?? 'medium'}-priority complaint`,
        body: truncate(record.title),
        route: `/(admin)/(ops)/complaints/${record.id}`,
        channelId: 'complaints',
        template: 'complaintNew',
        params: {
          priority: titleize(record.priority ?? 'medium'),
          complaintTitle: truncate(record.title),
        },
      });
    }
  }

  if (
    table === 'complaints' &&
    type === 'UPDATE' &&
    record &&
    old_record &&
    (fieldChanged(record.status, old_record.status) ||
      fieldChanged(record.assigned_to, old_record.assigned_to))
  ) {
    const statusChanged = fieldChanged(record.status, old_record.status);
    const assigneeChanged = fieldChanged(record.assigned_to, old_record.assigned_to);
    const actorId = typeof record.updated_by === 'string' ? record.updated_by : null;

    const societyAdminIds = await adminsForSociety(supabase, record.society_id);
    const participantIds = unique([record.raised_by, record.assigned_to]);
    const participants = await profilesByIds(supabase, participantIds);

    const adminIds = excludeIds(
      unique([
        ...societyAdminIds,
        ...participants.filter((profile) => profile.role === 'admin').map((profile) => profile.id),
      ]),
      actorId,
    );

    const residentIds = excludeIds(
      participants.filter((profile) => profile.role !== 'admin').map((profile) => profile.id),
      actorId,
    ).filter((id) => {
      if (id !== record.raised_by) return assigneeChanged;
      return statusChanged || assigneeChanged;
    });

    if (adminIds.length) {
      dispatches.push({
        profileIds: adminIds,
        title: `Complaint ${titleize(record.status)}`,
        body: truncate(record.title),
        route: `/(admin)/(ops)/complaints/${record.id}`,
        channelId: 'complaints',
        template: 'complaintStatusChanged',
        params: {
          status: titleize(record.status),
          complaintTitle: truncate(record.title),
        },
      });
    }

    if (residentIds.length) {
      dispatches.push({
        profileIds: residentIds,
        title: `Complaint ${titleize(record.status)}`,
        body: truncate(record.title),
        route: `/(resident)/(menu)/complaints/${record.id}`,
        channelId: 'complaints',
        template: 'complaintStatusChanged',
        params: {
          status: titleize(record.status),
          complaintTitle: truncate(record.title),
        },
      });
    }
  }

  // --- Complaint updates -----------------------------------------------
  if (table === 'complaint_updates' && type === 'INSERT' && record) {
    const { data: complaint } = await supabase
      .from('complaints')
      .select('raised_by, assigned_to, title, society_id')
      .eq('id', record.complaint_id)
      .single();
    if (complaint) {
      const participantIds = unique(
        [complaint.raised_by, complaint.assigned_to].filter((id) => id && id !== record.profile_id),
      );
      const participants = await profilesByIds(supabase, participantIds);

      const adminParticipantIds =
        participants.filter((profile) => profile.role === 'admin').map((profile) => profile.id);
      const residentParticipantIds =
        participants.filter((profile) => profile.role !== 'admin').map((profile) => profile.id);

      const societyAdminIds = excludeIds(
        await adminsForSociety(supabase, complaint.society_id),
        record.profile_id,
      );

      const adminIds = unique([...adminParticipantIds, ...societyAdminIds]);
      const residentIds = residentParticipantIds;

      if (adminIds.length) {
        dispatches.push({
          profileIds: adminIds,
          title: `New comment on: ${truncate(complaint.title, 40)}`,
          body: truncate(record.body),
          route: `/(admin)/(ops)/complaints/${record.complaint_id}`,
          channelId: 'complaints',
          template: 'complaintNewComment',
          params: {
            complaintTitle: truncate(complaint.title, 40),
            comment: truncate(record.body),
          },
        });
      }

      if (residentIds.length) {
        dispatches.push({
          profileIds: residentIds,
          title: `New comment on: ${truncate(complaint.title, 40)}`,
          body: truncate(record.body),
          route: `/(resident)/(menu)/complaints/${record.complaint_id}`,
          channelId: 'complaints',
          template: 'complaintNewComment',
          params: {
            complaintTitle: truncate(complaint.title, 40),
            comment: truncate(record.body),
          },
        });
      }
    }
  }

  // --- Join requests ----------------------------------------------------
  if (
    table === 'profiles' &&
    type === 'UPDATE' &&
    record?.status === 'pending' &&
    record?.society_id &&
    !old_record?.society_id
  ) {
    const profileIds = await adminsForSociety(supabase, record.society_id);
    const roleLabel = record.role === 'guard' ? 'A guard' : 'A resident';
    dispatches.push({
      profileIds,
      title: 'New join request',
      body: `${record.full_name ?? roleLabel} requested to join your society.`,
      route: '/(admin)/(society)/pending',
      channelId: 'notices',
      template: 'joinRequestNew',
      params: { name: record.full_name ?? roleLabel },
    });
  }

  // --- Dues -------------------------------------------------------------
  if (table === 'dues' && type === 'INSERT' && record) {
    const profileIds = await residentsForFlat(supabase, record.flat_id);
    const periodEn = formatDuesPeriod(record.period, 'en');
    dispatches.push({
      profileIds,
      title: `Dues for ${periodEn}`,
      body: `Amount \u20B9${record.total} \u2022 Due ${record.due_date}`,
      route: `/(resident)/(payments)`,
      channelId: 'payments',
      template: 'duesCreated',
      params: {
        period: periodEn,
        periodHi: formatDuesPeriod(record.period, 'hi'),
        amount: String(record.total),
        dueDate: String(record.due_date),
      },
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

async function filterByPreferences(
  supabase: SupabaseClient,
  profileIds: string[],
  channelId: ChannelId,
): Promise<string[]> {
  if (!profileIds.length) return [];

  const column =
    channelId === 'visitor-approval'
      ? 'visitors'
      : channelId === 'notices'
        ? 'notices'
        : channelId === 'polls'
          ? 'polls'
          : channelId === 'payments'
            ? 'payments'
            : channelId === 'complaints'
              ? 'complaints'
              : null;

  if (!column) return profileIds;

  const { data, error } = await supabase
    .from('notification_preferences')
    .select('profile_id, visitors, notices, polls, payments, complaints')
    .in('profile_id', profileIds);

  if (error) {
    console.error('notification_preferences lookup failed', error);
    return profileIds;
  }

  const prefs = new Map((data ?? []).map((row) => [row.profile_id, row]));
  return profileIds.filter((id) => {
    const pref = prefs.get(id);
    if (!pref) return true;
    return pref[column as keyof typeof pref] !== false;
  });
}

async function sendPushToProfiles(
  supabase: SupabaseClient,
  dispatch: Dispatch,
  notificationIds?: Map<string, string>,
): Promise<void> {
  const targets = unique(await filterByPreferences(supabase, dispatch.profileIds, dispatch.channelId));
  if (!targets.length) return;

  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('expo_token, profile_id')
    .in('profile_id', targets)
    .eq('active', true);

  if (!tokens?.length) return;

  const localeByProfile = await localesByProfileIds(supabase, targets);

  const priority: 'default' | 'high' =
    dispatch.channelId === 'visitor-approval' ||
    dispatch.channelId === 'complaints' ||
    dispatch.channelId === 'payments'
      ? 'high'
      : 'default';

  const messages: PushMessage[] = tokens.map((row) => {
    const locale = localeByProfile.get(row.profile_id) ?? 'en';
    const text = localizedText(dispatch, locale);
    return {
      to: row.expo_token,
      title: text.title,
      body: text.body,
      channelId: dispatch.channelId,
      priority,
      data: {
        url: dispatch.route,
        notificationId: notificationIds?.get(row.profile_id),
        channelId: dispatch.channelId,
      },
    };
  });

  await sendExpoPush(messages);
}

async function persistAndPush(supabase: SupabaseClient, dispatch: Dispatch): Promise<void> {
  const targets = unique(await filterByPreferences(supabase, dispatch.profileIds, dispatch.channelId));
  if (!targets.length) return;

  const data: Record<string, unknown> = {
    url: dispatch.route,
    pushDispatched: true,
  };
  if (dispatch.template) {
    data.template = dispatch.template;
    data.params = dispatch.params ?? {};
  }

  const rows = targets.map((profileId) => ({
    profile_id: profileId,
    category: dispatch.channelId,
    title: dispatch.title,
    body: dispatch.body,
    data,
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

  await sendPushToProfiles(supabase, { ...dispatch, profileIds: targets }, idByProfile);
}

async function pushOnly(supabase: SupabaseClient, record: Record<string, any>): Promise<void> {
  const profileId = record.profile_id as string | undefined;
  if (!profileId) return;

  const channelId = (record.channel_id ?? 'notices') as ChannelId;
  const route =
    typeof record.route === 'string' && record.route.length > 0
      ? record.route
      : defaultNotificationsRoute(
          typeof record.role === 'string' ? record.role : 'resident',
        );

  const notificationIds = new Map<string, string>();
  if (typeof record.notification_id === 'string') {
    notificationIds.set(profileId, record.notification_id);
  }

  const template = typeof record.template === 'string'
    ? record.template as NotificationTemplateId
    : undefined;
  const params = (record.params && typeof record.params === 'object')
    ? record.params as NotificationTemplateParams
    : undefined;

  await sendPushToProfiles(
    supabase,
    {
      profileIds: [profileId],
      title: record.title ?? 'Notification',
      body: record.body ?? '',
      route,
      channelId,
      template,
      params,
    },
    notificationIds,
  );
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
    if (payload.table === '_push_only' && payload.record) {
      await pushOnly(supabase, payload.record);
      return new Response(JSON.stringify({ ok: true, dispatches: 1 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

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
