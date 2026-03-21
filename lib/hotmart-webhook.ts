import type { UserPlan } from '@/lib/plans';

/** Eventos que liberam o produto (nomes variam na Hotmart / histórico). */
const GRANT_EVENT_SUBSTRINGS = [
  'PURCHASE_APPROVED',
  'PURCHASE_COMPLETE',
  'PURCHASE_FINISHED',
  'PURCHASE_ORDER',
  'SUBSCRIPTION_ACTIVATION',
  'SUBSCRIPTION_REACTIVATION',
  'SUBSCRIPTION_RENEWAL',
  'SWITCH_PLAN', // upgrade/downgrade em assinatura
];

const REVOKE_EVENT_SUBSTRINGS = [
  'REFUND',
  'CHARGEBACK',
  'CANCEL',
  'CANCELLATION',
  'CANCELED',
  'CANCELLED',
  'EXPIRED',
];

function normalizeEvent(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw.trim().toUpperCase().replace(/\./g, '_').replace(/\s+/g, '_');
}

export function isGrantEvent(event: string): boolean {
  const e = normalizeEvent(event);
  if (!e) return false;
  return GRANT_EVENT_SUBSTRINGS.some((g) => e.includes(g) || e === g);
}

export function isRevokeEvent(event: string): boolean {
  const e = normalizeEvent(event);
  if (!e) return false;
  return REVOKE_EVENT_SUBSTRINGS.some((r) => e.includes(r));
}

function firstString(...vals: unknown[]): string | null {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  }
  return null;
}

/** Nó principal onde a Hotmart costuma colocar compra / comprador (varia por versão). */
function getDataRoot(body: Record<string, unknown>): Record<string, unknown> {
  const raw = body.data ?? body.payload ?? body;
  return (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
}

/**
 * Extrai e-mail do comprador de vários formatos de payload Hotmart / postback.
 * (Documentação oficial muda; o histórico de webhooks na Hotmart é a fonte da verdade.)
 */
export function extractBuyerEmail(body: Record<string, unknown>): string | null {
  const data = getDataRoot(body);

  const buyer = data.buyer as Record<string, unknown> | undefined;
  const purchase = data.purchase as Record<string, unknown> | undefined;
  const subscriber = data.subscriber as Record<string, unknown> | undefined;
  const user = data.user as Record<string, unknown> | undefined;
  const customer = data.customer as Record<string, unknown> | undefined;
  const fromPurchaseBuyer = purchase?.buyer as Record<string, unknown> | undefined;

  return firstString(
    buyer?.email,
    purchase?.buyer_email,
    fromPurchaseBuyer?.email,
    subscriber?.email,
    user?.email,
    customer?.email,
    data.buyer_email,
    data.email,
    body.email,
    (body as { buyer_email?: string }).buyer_email,
  );
}

/**
 * ID do produto Hotmart (número ou string).
 */
export function extractProductId(body: Record<string, unknown>): string | null {
  const data = getDataRoot(body);
  const product = data.product as Record<string, unknown> | undefined;
  const purchase = data.purchase as Record<string, unknown> | undefined;
  const offer = purchase?.offer as Record<string, unknown> | undefined;
  const items = data.items as unknown[] | undefined;
  const firstItem = items?.[0] as Record<string, unknown> | undefined;
  const itemProduct = firstItem?.product as Record<string, unknown> | undefined;

  return firstString(
    product?.id,
    product?.product_id,
    product?.productId,
    purchase?.product_id,
    purchase?.productId,
    offer?.product_id,
    offer?.id,
    itemProduct?.id,
    itemProduct?.product_id,
    data.product_id,
    data.productId,
    body.product_id,
  );
}

export function extractTransactionId(body: Record<string, unknown>): string | null {
  const data = getDataRoot(body);
  const purchase = data.purchase as Record<string, unknown> | undefined;

  return firstString(
    purchase?.transaction,
    purchase?.order_id,
    purchase?.purchase_id,
    purchase?.transaction_id,
    data.transaction,
    data.transaction_id,
    data.purchase_id,
    data.order_id,
    body.transaction,
  );
}

export function extractEventName(body: Record<string, unknown>): string {
  const data = getDataRoot(body);
  const raw =
    body.event ??
    body.Event ??
    body.event_name ??
    data.event ??
    data.event_name ??
    data.type ??
    body.type ??
    body.status ??
    data.status;
  return typeof raw === 'string' ? raw : '';
}

/**
 * Mapeia product_id da Hotmart para plano Revela usando variáveis de ambiente.
 */
export function resolvePlanFromProductId(productId: string | null): UserPlan | null {
  if (!productId) return null;
  const normalized = productId.trim();

  const premiumIds = (process.env.HOTMART_PREMIUM_PRODUCT_IDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const proIds = (process.env.HOTMART_PRO_PRODUCT_IDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (premiumIds.includes(normalized)) return 'premium';
  if (proIds.includes(normalized)) return 'pro';

  return null;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Valida token opcional (Hotmart pode enviar hottok no body ou query).
 */
export function verifyHotmartToken(
  body: Record<string, unknown>,
  searchParams: URLSearchParams,
  headers: Headers,
): boolean {
  const secret = process.env.HOTMART_WEBHOOK_TOKEN;
  if (!secret) {
    // Sem token configurado: ambiente de dev ou esquecimento — recusar em produção
    if (process.env.NODE_ENV === 'production') {
      return false;
    }
    return true;
  }

  const fromBody =
    typeof body.hottok === 'string'
      ? body.hottok
      : typeof (body as { token?: string }).token === 'string'
        ? (body as { token: string }).token
        : null;
  const fromQuery = searchParams.get('hottok') || searchParams.get('token');
  const auth = headers.get('authorization');
  const fromBearer =
    auth?.startsWith('Bearer ') ? auth.slice(7).trim() : null;

  const received = fromBody || fromQuery || fromBearer;
  return received === secret;
}
