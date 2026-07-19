import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { corsHeaders, handleCorsPreflight, rejectDisallowedOrigin } from '../_shared/cors.ts';

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  const originRejected = rejectDisallowedOrigin(req);
  if (originRejected) return originRejected;

  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders(req) });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json(req, { error: 'unauthorized' }, 401);

  const { email, name, age, flatId, relation } = await req.json();
  const normalizedEmail = typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : null;
  const normalizedName = typeof name === 'string' && name.trim() ? name.trim() : (normalizedEmail || 'Resident');
  const normalizedRelation = typeof relation === 'string' && relation.trim() ? relation.trim() : null;
  const ageVal = typeof age === 'number' ? age : null;
  const flatIdVal = typeof flatId === 'string' && flatId.trim() ? flatId.trim() : null;

  if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return json(req, { error: 'invalid_email' }, 400);
  }

  const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();
  if (userError || !user) return json(req, { error: 'unauthorized' }, 401);

  const serviceClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: callerProfile, error: callerError } = await serviceClient
    .from('profiles')
    .select('id, role, society_id, status')
    .eq('id', user.id)
    .single();

  if (callerError || !callerProfile || callerProfile.status !== 'active') {
    return json(req, { error: 'forbidden' }, 403);
  }

  // Permission check if caller is not an admin assigning to a flat
  if (callerProfile.role !== 'admin' && flatIdVal) {
    const { data: flatRes, error: flatResError } = await serviceClient
      .from('flat_residents')
      .select('profile_id')
      .eq('profile_id', user.id)
      .eq('flat_id', flatIdVal)
      .maybeSingle();

    if (flatResError || !flatRes) {
      return json(req, { error: 'forbidden_flat' }, 403);
    }
  }

  // If email is provided, check if already in auth and send invite email
  if (normalizedEmail) {
    let page = 1;
    let existing = null;
    while (true) {
      const { data, error } = await serviceClient.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) break;

      existing = data.users.find((item) => item.email?.toLowerCase() === normalizedEmail);
      if (existing || data.users.length < 1000) break;
      page += 1;
    }

    if (!existing) {
      const inviteRes = await serviceClient.auth.admin.inviteUserByEmail(normalizedEmail, {
        data: { full_name: normalizedName },
      });
      if (inviteRes.error) {
        console.warn('Could not send invite email via auth.admin.inviteUserByEmail:', inviteRes.error.message);
      }
    }
  }

  const { data: inviteRecord, error: insertError } = await serviceClient
    .from('family_members')
    .insert({
      email: normalizedEmail,
      name: normalizedName,
      age: ageVal,
      flat_id: flatIdVal,
      profile_id: user.id,
      relation: normalizedRelation,
    })
    .select('*')
    .single();

  if (insertError) {
    return json(req, { error: insertError.message }, 500);
  }

  return json(req, { success: true, invite: inviteRecord });
});
