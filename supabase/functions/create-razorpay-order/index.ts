import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { corsHeaders, handleCorsPreflight, rejectDisallowedOrigin } from '../_shared/cors.ts';

const RZP_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID')!;
const RZP_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')!;

function json(req: Request, body: unknown, status = 200) {
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
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
  if (!authHeader) return new Response('Unauthorized', { status: 401, headers: corsHeaders(req) });

  const { amount, purpose, referenceId, referenceIds } = await req.json();
  if (!amount || amount <= 0) return new Response('Invalid amount', { status: 400, headers: corsHeaders(req) });

  const dueIds: string[] =
    Array.isArray(referenceIds) && referenceIds.length
      ? referenceIds
      : referenceId
        ? [referenceId]
        : [];

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return new Response('Unauthorized', { status: 401, headers: corsHeaders(req) });

  const VALID_PURPOSES = ['dues', 'amenity', 'deposit', 'other'];
  if (!purpose || !VALID_PURPOSES.includes(purpose)) {
    return json(req, { error: 'invalid_purpose' }, 400);
  }

  const serviceClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  if (purpose === 'dues' && dueIds.length) {
    const { data: dues, error: duesError } = await serviceClient
      .from('dues')
      .select('id, total, flat_id, status')
      .in('id', dueIds);
    if (duesError || !dues?.length || dues.length !== dueIds.length) {
      return json(req, { error: 'reference_not_found' }, 400);
    }

    const openStatuses = new Set(['due', 'overdue', 'partial']);
    if (dues.some((due) => !openStatuses.has(due.status))) {
      return json(req, { error: 'dues_not_payable' }, 400);
    }

    const flatIds = [...new Set(dues.map((due) => due.flat_id))];
    const { data: links, error: linksError } = await serviceClient
      .from('flat_residents')
      .select('flat_id')
      .eq('profile_id', user.id)
      .in('flat_id', flatIds);
    if (linksError || (links?.length ?? 0) !== flatIds.length) {
      return json(req, { error: 'not_your_dues' }, 403);
    }

    const expectedTotal = dues.reduce((sum, due) => sum + Number(due.total), 0);
    if (Number(amount) !== expectedTotal) {
      return json(req, { error: 'amount_mismatch', expected: expectedTotal }, 400);
    }
  }

  if (purpose === 'amenity' && referenceId) {
    const { data: booking, error: bookingError } = await serviceClient
      .from('amenity_bookings')
      .select('total_amount, profile_id')
      .eq('id', referenceId)
      .single();
    if (bookingError || !booking) {
      return json(req, { error: 'reference_not_found' }, 400);
    }
    if (booking.profile_id !== user.id) {
      return json(req, { error: 'not_your_booking' }, 403);
    }
    if (Number(amount) !== Number(booking.total_amount)) {
      return json(req, { error: 'amount_mismatch', expected: booking.total_amount }, 400);
    }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('society_id, full_name')
    .eq('id', user.id)
    .single();
  if (profileError || !profile?.society_id) {
    return json(req, { error: 'profile_not_found' }, 400);
  }

  const primaryReferenceId = purpose === 'dues' ? dueIds[0] ?? referenceId ?? null : referenceId ?? null;
  const bulkReferenceIds = purpose === 'dues' && dueIds.length > 1 ? dueIds : null;

  const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
    body: JSON.stringify({
      amount: Math.round(Number(amount) * 100),
      currency: 'INR',
      notes: {
        profileId: user.id,
        purpose,
        referenceId: primaryReferenceId ?? '',
        referenceIds: bulkReferenceIds?.join(',') ?? '',
      },
      receipt: `${purpose}_${primaryReferenceId ?? crypto.randomUUID()}`.slice(0, 40),
    }),
    headers: {
      Authorization: `Basic ${btoa(`${RZP_KEY_ID}:${RZP_KEY_SECRET}`)}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });
  const order = await razorpayResponse.json();
  if (!razorpayResponse.ok || !order.id) {
    return json(req, order, 400);
  }

  const { data: paymentRow, error: paymentError } = await serviceClient
    .from('payments')
    .insert({
      amount: Number(amount),
      currency: 'INR',
      order_id: order.id,
      profile_id: user.id,
      purpose,
      reference_id: primaryReferenceId,
      reference_ids: bulkReferenceIds,
      society_id: profile.society_id,
      status: 'created',
    })
    .select('id')
    .single();
  if (paymentError || !paymentRow) {
    return json(req, { error: paymentError?.message ?? 'payment_insert_failed' }, 400);
  }

  if (purpose === 'amenity' && referenceId) {
    await serviceClient.from('amenity_bookings').update({ payment_id: paymentRow.id }).eq('id', referenceId);
  }

  return json(req, { amount: Number(amount), currency: 'INR', keyId: RZP_KEY_ID, orderId: order.id });
});
