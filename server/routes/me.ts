import { Router } from "express";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

export const meRouter = Router();

meRouter.use(requireAuth);

/**
 * GET /api/me
 *
 * Returns everything the frontend AuthContext needs to bootstrap a session:
 * the user's profile, their tenant (if any), and their role (if any).
 *
 * Note: this route uses only requireAuth — not requireTenant — because users
 * who are still in onboarding don't have a tenant yet, and the AuthContext
 * needs to know about that state to redirect them correctly.
 */
meRouter.get("/", async (req, res, next) => {
  try {
    const { supabase, userId } = (req as AuthedRequest).auth;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (profileError) throw profileError;

    let tenant = null;
    if (profile?.tenant_id) {
      const { data: tenantData, error: tenantError } = await supabase
        .from("tenants")
        .select("*")
        .eq("id", profile.tenant_id)
        .maybeSingle();
      if (tenantError) throw tenantError;
      tenant = tenantData;
    }

    const { data: roleRow, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();
    if (roleError) throw roleError;

    res.json({
      profile: profile ?? null,
      tenant,
      role: roleRow?.role ?? null,
    });
  } catch (err) {
    next(err);
  }
});
