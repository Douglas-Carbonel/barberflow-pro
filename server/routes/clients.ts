import { Router } from "express";
import { z } from "zod";
import {
  requireAuth,
  requireTenant,
  type AuthedRequest,
} from "../middleware/auth.js";

export const clientsRouter = Router();

clientsRouter.use(requireAuth, requireTenant);

const upsertSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório"),
  phone: z.string().trim().nullish(),
  email: z.string().trim().email("E-mail inválido").nullish().or(z.literal("")),
  birthday: z.string().nullish().or(z.literal("")),
  notes: z.string().nullish(),
  tags: z.array(z.string()).default([]),
});

// GET /api/clients
clientsRouter.get("/", async (req, res, next) => {
  try {
    const { supabase, tenantId } = (req as AuthedRequest).auth;
    const { data, error } = await supabase
      .from("clients")
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

// POST /api/clients
clientsRouter.post("/", async (req, res, next) => {
  try {
    const { supabase, tenantId } = (req as AuthedRequest).auth;
    const parsed = upsertSchema.parse(req.body);
    const payload = normalize(parsed);
    const { data, error } = await supabase
      .from("clients")
      .insert({ tenant_id: tenantId, ...payload })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/clients/:id
clientsRouter.patch("/:id", async (req, res, next) => {
  try {
    const { supabase } = (req as AuthedRequest).auth;
    const parsed = upsertSchema.partial().parse(req.body);
    const payload = normalize(parsed);
    const { data, error } = await supabase
      .from("clients")
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

// DELETE /api/clients/:id  (soft delete)
clientsRouter.delete("/:id", async (req, res, next) => {
  try {
    const { supabase } = (req as AuthedRequest).auth;
    const { error } = await supabase
      .from("clients")
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
  if (input.phone !== undefined) out.phone = input.phone?.trim() || null;
  if (input.email !== undefined) out.email = input.email?.trim() || null;
  if (input.birthday !== undefined) out.birthday = input.birthday || null;
  if (input.notes !== undefined) out.notes = input.notes?.trim() || null;
  if (input.tags !== undefined) out.tags = input.tags;
  return out;
}
