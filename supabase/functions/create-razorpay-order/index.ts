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

  const { error: paymentError } = await supabase.from('payments').insert({
    amount: Number(amount),
    currency: 'INR',
    order_id: order.id,
    profile_id: user.id,
    purpose,
    reference_id: referenceId ?? null,
    society_id: profile.society_id,
    status: 'created',
  });
  if (paymentError) {
    return new Response(JSON.stringify({ error: paymentError.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify({ amount: Number(amount), currency: 'INR', keyId: RZP_KEY_ID, orderId: order.id }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
