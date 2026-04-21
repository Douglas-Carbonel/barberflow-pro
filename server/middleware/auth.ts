import type { NextFunction, Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import { supabaseForRequest } from "../lib/supabase.js";

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? "";

export interface AuthedRequest extends Request {
  auth: {
    userId: string;
    tenantId: string | null;
    jwt: string;
    supabase: ReturnType<typeof supabaseForRequest>;
  };
}

/**
 * Validates the Authorization: Bearer <jwt> header against Supabase Auth,
 * resolves the user's profile to attach the tenant_id, and exposes a
 * pre-built RLS-scoped Supabase client on req.auth.supabase.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const header = req.header("Authorization") ?? "";
    const jwt = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!jwt) {
      return res.status(401).json({ error: "Missing bearer token" });
    }

    // Verify the token using a baseline anon client
    const verifier = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await verifier.auth.getUser(jwt);
    if (error || !data.user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const supabase = supabaseForRequest(jwt);
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", data.user.id)
      .maybeSingle();

    (req as AuthedRequest).auth = {
      userId: data.user.id,
      tenantId: (profile?.tenant_id as string | null) ?? null,
      jwt,
      supabase,
    };
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Many resource routes only make sense in the context of a tenant. This
 * helper returns 403 if the caller is authenticated but has no tenant
 * (e.g. they're still in onboarding).
 */
export function requireTenant(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const auth = (req as AuthedRequest).auth;
  if (!auth?.tenantId) {
    return res.status(403).json({ error: "User is not linked to a tenant" });
  }
  next();
}
