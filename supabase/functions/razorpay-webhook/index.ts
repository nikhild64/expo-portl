import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SECRET = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')!;

async function hmacSha256Hex(secret: string, body: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { hash: 'SHA-256', name: 'HMAC' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function safeEqual(a: string | null, b: string) {
  if (!a || a.length !== b.length) return false;
  let result = 0;
  for (let index = 0; index < a.length; index += 1) {
    result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return result === 0;
}

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const body = await req.text();
  const signature = req.headers.get('X-Razorpay-Signature');
  const expected = await hmacSha256Hex(SECRET, body);
  if (!safeEqual(signature, expected)) return new Response('Invalid signature', { status: 400 });

  const event = JSON.parse(body);
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  if (event.event === 'payment.captured') {
    const payment = event.payload.payment.entity;
    const { data: paymentRow, error } = await supabase
      .from('payments')
      .update({
        captured_at: new Date().toISOString(),
        raw_webhook: event,
        razorpay_payment_id: payment.id,
        razorpay_signature: signature,
        status: 'captured',
      })
      .eq('order_id', payment.order_id)
      .select('*')
      .single();

    if (!error && paymentRow) {
      if (paymentRow.purpose === 'dues' && paymentRow.reference_id) {
        await supabase
          .from('dues')
          .update({ paid_at: new Date().toISOString(), payment_id: paymentRow.id, status: 'paid' })
          .eq('id', paymentRow.reference_id);
      }

      if (paymentRow.purpose === 'amenity' && paymentRow.reference_id) {
        await supabase
          .from('amenity_bookings')
          .update({ payment_id: paymentRow.id, status: 'confirmed' })
          .eq('id', paymentRow.reference_id);
      }

      await supabase.from('notifications').insert({
        body: `INR ${paymentRow.amount} received.`,
        category: 'payment',
        data: { paymentId: paymentRow.id },
        profile_id: paymentRow.profile_id,
        title: 'Payment successful',
      });
    }
  }

  if (event.event === 'payment.failed') {
    const payment = event.payload.payment.entity;
    await supabase.from('payments').update({ raw_webhook: event, status: 'failed' }).eq('order_id', payment.order_id);
  }

  return new Response('ok');
});
