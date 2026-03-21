import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Cliente Supabase com service role — apenas em rotas de API no servidor.
 * Nunca importar em componentes cliente.
 */
export function createSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return null;
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
