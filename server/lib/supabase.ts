import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? "";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // We don't throw here so the dev server can still start without the key,
  // but every API call that needs Supabase will fail with 500 until it's set.
  console.warn(
    "[api] Missing SUPABASE_URL / SUPABASE_ANON_KEY. /api routes will fail.",
  );
}

/**
 * Build a Supabase client scoped to the calling user's JWT.
 * This keeps RLS enforced server-side, so tenant isolation does not depend
 * on the API code being correct — the database itself blocks cross-tenant
 * access. As we migrate off Supabase, this is the seam we'll replace with
 * direct Postgres + an explicit `WHERE tenant_id = ?` guard.
 */
export function supabaseForRequest(jwt: string): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
