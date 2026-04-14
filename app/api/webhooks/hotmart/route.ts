import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase-admin';
import type { UserPlan } from '@/lib/plans';
import {
  extractBuyerEmail,
  extractEventName,
  extractProductId,
  extractTransactionId,
  isGrantEvent,
  isRevokeEvent,
  normalizeEmail,
  parseHotmartWebhookBody,
  resolvePlanFromProductId,
  verifyHotmartToken,
} from '@/lib/hotmart-webhook';

export const dynamic = 'force-dynamic';

/**
 * Webhook Hotmart: libera ou revoga plano Pro/Premium na tabela `revela_entitlements`.
 *
 * Configure na Hotmart a URL: https://SEU_DOMINIO/api/webhooks/hotmart
 * Variáveis: HOTMART_WEBHOOK_TOKEN, HOTMART_PRO_PRODUCT_IDS, HOTMART_PREMIUM_PRODUCT_IDS, SUPABASE_SERVICE_ROLE_KEY
 */
export async function POST(request: NextRequest) {
  const text = await request.text();
  const body = text
    ? parseHotmartWebhookBody(text, request.headers.get('content-type'))
    : {};

  if (text && Object.keys(body).length === 0) {
    return NextResponse.json({ ok: false, error: 'Invalid body' }, { status: 400 });
  }

  if (process.env.HOTMART_WEBHOOK_DEBUG === '1') {
    const preview = JSON.stringify(body).slice(0, 4000);
    console.warn('[Hotmart webhook] DEBUG payload (truncado):', preview);
  }

  const url = new URL(request.url);
  if (!verifyHotmartToken(body, url.searchParams, request.headers)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createSupabaseAdmin();
  if (!admin) {
    console.error('[Hotmart webhook] SUPABASE_SERVICE_ROLE_KEY ou URL ausente');
    return NextResponse.json({ ok: false, error: 'Server misconfigured' }, { status: 500 });
  }

  const event = extractEventName(body);
  const emailRaw = extractBuyerEmail(body);
  const productId = extractProductId(body);
  const transactionId = extractTransactionId(body);

  if (!emailRaw) {
    console.warn('[Hotmart webhook] Sem e-mail no payload', JSON.stringify(body).slice(0, 500));
    return NextResponse.json({ ok: false, error: 'No buyer email' }, { status: 400 });
  }

  const email = normalizeEmail(emailRaw);

  if (isRevokeEvent(event)) {
    const { error } = await admin.from('revela_entitlements').upsert(
      {
        email,
        plan: 'pro',
        active: false,
        hotmart_transaction_id: transactionId,
        last_event: event,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'email' },
    );

    if (error) {
      console.error('[Hotmart webhook] revoke upsert', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, action: 'revoked', email });
  }

  if (!isGrantEvent(event)) {
    // Evento ignorado (ex.: clique, carrinho) — 200 para Hotmart não desativar o webhook
    return NextResponse.json({ ok: true, ignored: true, event });
  }

  const plan = resolvePlanFromProductId(productId);
  if (!plan) {
    console.warn(
      '[Hotmart webhook] product_id não mapeado. Defina HOTMART_PRO_PRODUCT_IDS e HOTMART_PREMIUM_PRODUCT_IDS. productId=',
      productId,
    );
    return NextResponse.json(
      { ok: false, error: 'Unknown product id — configure HOTMART_*_PRODUCT_IDS', productId },
      { status: 422 },
    );
  }

  const row = {
    email,
    plan: plan as UserPlan,
    active: true,
    hotmart_transaction_id: transactionId,
    last_event: event,
    updated_at: new Date().toISOString(),
  };

  const { error } = await admin.from('revela_entitlements').upsert(row, { onConflict: 'email' });

  if (error) {
    console.error('[Hotmart webhook] grant upsert', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, action: 'granted', email, plan });
}

/** Hotmart às vezes testa com GET */
export async function GET() {
  return NextResponse.json({ ok: true, service: 'revela-hotmart-webhook' });
}
