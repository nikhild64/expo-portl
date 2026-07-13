import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Origin': '*',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'unauthorized' }, 401);

  const { email, fullName, password, phone } = await req.json();
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const normalizedName = typeof fullName === 'string' ? fullName.trim() : '';

  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return json({ error: 'invalid_email' }, 400);
  }
  if (normalizedName.length < 2) {
    return json({ error: 'invalid_name' }, 400);
  }
  if (typeof password !== 'string' || password.length < 8) {
    return json({ error: 'invalid_password' }, 400);
  }

  const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();
  if (userError || !user) return json({ error: 'unauthorized' }, 401);

  const serviceClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: adminProfile, error: adminProfileError } = await serviceClient
    .from('profiles')
    .select('id, role, society_id, status')
    .eq('id', user.id)
    .single();

  if (
    adminProfileError ||
    !adminProfile ||
    adminProfile.role !== 'admin' ||
    adminProfile.status !== 'active' ||
    !adminProfile.society_id
  ) {
    return json({ error: 'forbidden' }, 403);
  }

  // Check if email already exists in auth
  let page = 1;
  while (true) {
    const { data, error } = await serviceClient.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return json({ error: 'lookup_failed' }, 500);

    const existing = data.users.find((item) => item.email?.toLowerCase() === normalizedEmail);
    if (existing) return json({ error: 'email_in_use' }, 409);

    if (data.users.length < 1000) break;
    page += 1;
  }

  const createdAuth = await serviceClient.auth.admin.createUser({
    email: normalizedEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name: normalizedName },
  });

  if (createdAuth.error) {
    return json({ error: createdAuth.error.message }, 400);
  }

  const guardUser = createdAuth.data.user;
  const phoneValue = typeof phone === 'string' && phone.trim() ? phone.trim() : null;

  const { data: profile, error: profileError } = await serviceClient
    .from('profiles')
    .upsert(
      {
        id: guardUser.id,
        society_id: adminProfile.society_id,
        full_name: normalizedName,
        phone: phoneValue,
        role: 'guard',
        status: 'active',
      },
      { onConflict: 'id' },
    )
    .select('id, full_name')
    .single();

  if (profileError) {
    await serviceClient.auth.admin.deleteUser(guardUser.id);
    return json({ error: profileError.message }, 500);
  }

  return json({
    profileId: profile.id,
    email: normalizedEmail,
    fullName: normalizedName,
  });
});
