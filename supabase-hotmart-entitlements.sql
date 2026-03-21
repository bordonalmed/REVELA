-- Revela: planos Pro/Premium liberados via webhook Hotmart
-- Execute no SQL Editor do Supabase (após autenticação).

-- Usa `text` para não depender da extensão `citext` (em alguns projetos ela vem desligada).
CREATE TABLE IF NOT EXISTS revela_entitlements (
  email text PRIMARY KEY,
  plan text NOT NULL CHECK (plan IN ('pro', 'premium')),
  active boolean NOT NULL DEFAULT true,
  hotmart_transaction_id text,
  last_event text,
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_revela_entitlements_active ON revela_entitlements (active) WHERE active = true;

ALTER TABLE revela_entitlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own entitlement" ON revela_entitlements;
CREATE POLICY "Users read own entitlement"
  ON revela_entitlements
  FOR SELECT
  USING (lower(email) = lower(auth.jwt() ->> 'email'));

-- Sem INSERT/UPDATE para usuários autenticados: apenas service role (webhook) grava.

COMMENT ON TABLE revela_entitlements IS 'Plano pago sincronizado pela Hotmart; leitura pelo app via RLS.';
