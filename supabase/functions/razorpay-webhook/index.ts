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

function redactPaymentEntity(entity: Record<string, unknown>) {
  const redacted = { ...entity };
  delete redacted.card;
  delete redacted.vpa;
  delete redacted.email;
  delete redacted.contact;
  return redacted;
}

function redactWebhookEvent(event: Record<string, unknown>) {
  const payload = event.payload as { payment?: { entity?: Record<string, unknown> } } | undefined;
  if (!payload?.payment?.entity) return event;

  return {
    ...event,
    payload: {
      ...payload,
      payment: {
        ...payload.payment,
        entity: redactPaymentEntity(payload.payment.entity),
      },
    },
  };
}

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const body = await req.text();
  const signature = req.headers.get('X-Razorpay-Signature');
  const expected = await hmacSha256Hex(SECRET, body);
  if (!safeEqual(signature, expected)) return new Response('Invalid signature', { status: 400 });

  const event = JSON.parse(body);
  const sanitizedEvent = redactWebhookEvent(event);
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  if (event.event === 'payment.captured') {
    const payment = event.payload.payment.entity;
    const { data: paymentRow, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', payment.order_id)
      .single();

    if (fetchError || !paymentRow) {
      return new Response('ok');
    }

    const expectedPaise = Math.round(Number(paymentRow.amount) * 100);
    const amountMatches = Number(payment.amount) === expectedPaise;
    const nextStatus = amountMatches ? 'captured' : 'flagged';

    const { data: updatedRow, error } = await supabase
      .from('payments')
      .update({
        captured_at: amountMatches ? new Date().toISOString() : null,
        raw_webhook: sanitizedEvent,
        razorpay_payment_id: payment.id,
        razorpay_signature: signature,
        status: nextStatus,
      })
      .eq('order_id', payment.order_id)
      .select('*')
      .single();

    if (!error && updatedRow && amountMatches) {
      if (updatedRow.purpose === 'dues') {
        const dueIds =
          updatedRow.reference_ids?.length
            ? updatedRow.reference_ids
            : updatedRow.reference_id
              ? [updatedRow.reference_id]
              : [];

        if (dueIds.length) {
          await supabase
            .from('dues')
            .update({ paid_at: new Date().toISOString(), payment_id: updatedRow.id, status: 'paid' })
            .in('id', dueIds);
        }
      }

      if (updatedRow.purpose === 'amenity' && updatedRow.reference_id) {
        await supabase
          .from('amenity_bookings')
          .update({ payment_id: updatedRow.id, status: 'confirmed' })
          .eq('id', updatedRow.reference_id);
      }

      await supabase.from('notifications').insert({
        body: `INR ${updatedRow.amount} received.`,
        category: 'payments',
        data: { paymentId: updatedRow.id, url: '/(resident)/(payments)', channelId: 'payments' },
        profile_id: updatedRow.profile_id,
        title: 'Payment successful',
      });
    }
  }

  if (event.event === 'payment.failed') {
    const payment = event.payload.payment.entity;
    const { data: paymentRow } = await supabase
      .from('payments')
      .update({ raw_webhook: sanitizedEvent, status: 'failed' })
      .eq('order_id', payment.order_id)
      .select('*')
      .maybeSingle();

    if (paymentRow?.purpose === 'amenity' && paymentRow.reference_id) {
      await supabase
        .from('amenity_bookings')
        .update({ status: 'failed' })
        .eq('id', paymentRow.reference_id)
        .eq('status', 'pending');
    }
  }

  return new Response('ok');
});
