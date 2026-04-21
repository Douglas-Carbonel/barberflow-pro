import { supabase } from "@/integrations/supabase/client";

/**
 * Centraliza todas as chamadas ao backend próprio.
 *
 * - Resolve a URL relativa `/api/...` (o Vite faz proxy para o Express em dev,
 *   e em produção o Express servirá tanto o front como a API no mesmo host).
 * - Anexa automaticamente o JWT do Supabase na requisição.
 * - Lança Error com mensagem amigável para o React Query/toast tratarem.
 */

type Json = unknown;

interface ApiOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: Json;
  signal?: AbortSignal;
}

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function api<T = unknown>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const { method = "GET", body, signal } = options;
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(await authHeader()),
  };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(path.startsWith("/") ? path : `/${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "error" in data
        ? String((data as { error: unknown }).error)
        : null) ?? `Erro ${res.status}`;
    throw new Error(message);
  }

  return data as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
