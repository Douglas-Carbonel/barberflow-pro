import { Router } from "express";
import { z } from "zod";
import {
  requireAuth,
  requireTenant,
  type AuthedRequest,
} from "../middleware/auth.js";

export const servicesRouter = Router();

servicesRouter.use(requireAuth, requireTenant);

const upsertSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório"),
  category_id: z.string().uuid().nullish().or(z.literal("")),
  description: z.string().trim().nullish(),
  price: z.number().min(0, "Preço inválido"),
  duration: z.number().int().positive("Duração inválida"),
  commission_rate: z.number().min(0).max(100).nullish(),
});

servicesRouter.get("/", async (req, res, next) => {
  try {
    const { supabase, tenantId } = (req as AuthedRequest).auth;
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("tenant_id", tenantId!)
      .eq("is_active", true)
      .order("name");
    if (error) throw error;
    res.json(data ?? []);
  } catch (err) {
    next(err);
  }
});

servicesRouter.post("/", async (req, res, next) => {
  try {
    const { supabase, tenantId } = (req as AuthedRequest).auth;
    const parsed = upsertSchema.parse(req.body);
    const payload = { ...normalize(parsed), tenant_id: tenantId };
    const { data, error } = await supabase
      .from("services")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

servicesRouter.patch("/:id", async (req, res, next) => {
  try {
    const { supabase } = (req as AuthedRequest).auth;
    const parsed = upsertSchema.partial().parse(req.body);
    const payload = normalize(parsed);
    const { data, error } = await supabase
      .from("services")
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

// Soft delete
servicesRouter.delete("/:id", async (req, res, next) => {
  try {
    const { supabase } = (req as AuthedRequest).auth;
    const { error } = await supabase
      .from("services")
      .update({ is_active: false })
      .eq("id", req.params.id);
    if (error) throw error;
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

function normalize(input: Partial<z.infer<typeof upsertSchema>>) {
  const out: Record<string, unknown> = {};
  if (input.name !== undefined) out.name = input.name?.trim();
  if (input.category_id !== undefined)
    out.category_id = input.category_id || null;
  if (input.description !== undefined)
    out.description = input.description?.trim() || null;
  if (input.price !== undefined) out.price = input.price;
  if (input.duration !== undefined) out.duration = input.duration;
  if (input.commission_rate !== undefined)
    out.commission_rate = input.commission_rate ?? null;
  return out;
}
