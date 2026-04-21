import { Router } from "express";
import { z } from "zod";
import {
  requireAuth,
  requireTenant,
  type AuthedRequest,
} from "../middleware/auth.js";

export const professionalsRouter = Router();

professionalsRouter.use(requireAuth, requireTenant);

const upsertSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório"),
  specialty: z.string().trim().nullish(),
  phone: z.string().trim().nullish(),
  email: z
    .string()
    .trim()
    .email("E-mail inválido")
    .nullish()
    .or(z.literal("")),
  commission_rate: z
    .number()
    .min(0, "Comissão inválida")
    .max(100, "Comissão inválida"),
  work_start: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Horário inválido"),
  work_end: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Horário inválido"),
  working_days: z.array(z.number().int().min(0).max(6)).optional(),
});

professionalsRouter.get("/", async (req, res, next) => {
  try {
    const { supabase, tenantId } = (req as AuthedRequest).auth;
    const { data, error } = await supabase
      .from("professionals")
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

professionalsRouter.post("/", async (req, res, next) => {
  try {
    const { supabase, tenantId } = (req as AuthedRequest).auth;
    const parsed = upsertSchema.parse(req.body);
    const payload = {
      ...normalize(parsed),
      tenant_id: tenantId,
      working_days: parsed.working_days ?? [1, 2, 3, 4, 5, 6],
    };
    const { data, error } = await supabase
      .from("professionals")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

professionalsRouter.patch("/:id", async (req, res, next) => {
  try {
    const { supabase } = (req as AuthedRequest).auth;
    const parsed = upsertSchema.partial().parse(req.body);
    const payload = normalize(parsed);
    const { data, error } = await supabase
      .from("professionals")
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
professionalsRouter.delete("/:id", async (req, res, next) => {
  try {
    const { supabase } = (req as AuthedRequest).auth;
    const { error } = await supabase
      .from("professionals")
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
  if (input.specialty !== undefined)
    out.specialty = input.specialty?.trim() || null;
  if (input.phone !== undefined) out.phone = input.phone?.trim() || null;
  if (input.email !== undefined) out.email = input.email?.trim() || null;
  if (input.commission_rate !== undefined)
    out.commission_rate = input.commission_rate;
  if (input.work_start !== undefined)
    out.work_start = ensureSeconds(input.work_start);
  if (input.work_end !== undefined)
    out.work_end = ensureSeconds(input.work_end);
  if (input.working_days !== undefined) out.working_days = input.working_days;
  return out;
}

function ensureSeconds(time: string): string {
  return time.length === 5 ? `${time}:00` : time;
}
