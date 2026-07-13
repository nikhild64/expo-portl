import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Origin': '*',
};

const RZP_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID')!;
const RZP_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

  const { amount, purpose, referenceId } = await req.json();
  if (!amount || amount <= 0) return new Response('Invalid amount', { status: 400, headers: corsHeaders });

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

  const VALID_PURPOSES = ['dues', 'amenity', 'deposit', 'other'];
  if (!purpose || !VALID_PURPOSES.includes(purpose)) {
    return new Response(JSON.stringify({ error: 'invalid_purpose' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const serviceClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  if (purpose === 'dues' && referenceId) {
    const { data: due, error: dueError } = await serviceClient
      .from('dues')
      .select('total, flat_id')
      .eq('id', referenceId)
      .single();
    if (dueError || !due) {
      return new Response(JSON.stringify({ error: 'reference_not_found' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { data: link } = await serviceClient
      .from('flat_residents')
      .select('flat_id')
      .eq('profile_id', user.id)
      .eq('flat_id', due.flat_id)
      .maybeSingle();
    if (!link) {
      return new Response(JSON.stringify({ error: 'not_your_dues' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (Number(amount) !== Number(due.total)) {
      return new Response(JSON.stringify({ error: 'amount_mismatch', expected: due.total }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  }

  if (purpose === 'amenity' && referenceId) {
    const { data: booking, error: bookingError } = await serviceClient
      .from('amenity_bookings')
      .select('total_amount, profile_id')
      .eq('id', referenceId)
      .single();
    if (bookingError || !booking) {
      return new Response(JSON.stringify({ error: 'reference_not_found' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (booking.profile_id !== user.id) {
      return new Response(JSON.stringify({ error: 'not_your_booking' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (Number(amount) !== Number(booking.total_amount)) {
      return new Response(JSON.stringify({ error: 'amount_mismatch', expected: booking.total_amount }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('society_id, full_name')
    .eq('id', user.id)
    .single();
  if (profileError || !profile?.society_id) {
    return new Response(JSON.stringify({ error: 'profile_not_found' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
    body: JSON.stringify({
      amount: Math.round(Number(amount) * 100),
      currency: 'INR',
      notes: { profileId: user.id, purpose, referenceId: referenceId ?? '' },
      receipt: `${purpose}_${referenceId ?? crypto.randomUUID()}`.slice(0, 40),
    }),
    headers: {
      Authorization: `Basic ${btoa(`${RZP_KEY_ID}:${RZP_KEY_SECRET}`)}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });
  const order = await razorpayResponse.json();
  if (!razorpayResponse.ok || !order.id) {
    return new Response(JSON.stringify(order), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const { data: paymentRow, error: paymentError } = await serviceClient
    .from('payments')
    .insert({
      amount: Number(amount),
      currency: 'INR',
      order_id: order.id,
      profile_id: user.id,
      purpose,
      reference_id: referenceId ?? null,
      society_id: profile.society_id,
      status: 'created',
    })
    .select('id')
    .single();
  if (paymentError || !paymentRow) {
    return new Response(JSON.stringify({ error: paymentError?.message ?? 'payment_insert_failed' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (purpose === 'amenity' && referenceId) {
    await serviceClient.from('amenity_bookings').update({ payment_id: paymentRow.id }).eq('id', referenceId);
  }

  return new Response(JSON.stringify({ amount: Number(amount), currency: 'INR', keyId: RZP_KEY_ID, orderId: order.id }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
