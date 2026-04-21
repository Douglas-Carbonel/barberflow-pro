import { Router } from "express";
import { z } from "zod";
import {
  requireAuth,
  requireTenant,
  type AuthedRequest,
} from "../middleware/auth.js";

export const serviceCategoriesRouter = Router();

serviceCategoriesRouter.use(requireAuth, requireTenant);

const upsertSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório"),
  description: z.string().trim().nullish(),
  sort_order: z.number().int().nonnegative().optional(),
});

serviceCategoriesRouter.get("/", async (req, res, next) => {
  try {
    const { supabase, tenantId } = (req as AuthedRequest).auth;
    const { data, error } = await supabase
      .from("service_categories")
      .select("*")
      .eq("tenant_id", tenantId!)
      .order("sort_order");
    if (error) throw error;
    res.json(data ?? []);
  } catch (err) {
    next(err);
  }
});

serviceCategoriesRouter.post("/", async (req, res, next) => {
  try {
    const { supabase, tenantId } = (req as AuthedRequest).auth;
    const parsed = upsertSchema.parse(req.body);

    // Auto-pick the next sort_order if the client didn't send one
    let sort_order = parsed.sort_order;
    if (sort_order === undefined) {
      const { data: last } = await supabase
        .from("service_categories")
        .select("sort_order")
        .eq("tenant_id", tenantId!)
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();
      sort_order = ((last?.sort_order as number | undefined) ?? 0) + 1;
    }

    const { data, error } = await supabase
      .from("service_categories")
      .insert({
        tenant_id: tenantId,
        name: parsed.name.trim(),
        description: parsed.description?.trim() || null,
        sort_order,
      })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

serviceCategoriesRouter.patch("/:id", async (req, res, next) => {
  try {
    const { supabase } = (req as AuthedRequest).auth;
    const parsed = upsertSchema.partial().parse(req.body);
    const payload: Record<string, unknown> = {};
    if (parsed.name !== undefined) payload.name = parsed.name.trim();
    if (parsed.description !== undefined)
      payload.description = parsed.description?.trim() || null;
    if (parsed.sort_order !== undefined) payload.sort_order = parsed.sort_order;

    const { data, error } = await supabase
      .from("service_categories")
      .update(payload)
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Hard delete — keeps the existing behavior. Frontend translates the FK error
// into "existem serviços nesta categoria" when relevant.
serviceCategoriesRouter.delete("/:id", async (req, res, next) => {
  try {
    const { supabase } = (req as AuthedRequest).auth;
    const { error } = await supabase
      .from("service_categories")
      .delete()
      .eq("id", req.params.id);
    if (error) throw error;
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
