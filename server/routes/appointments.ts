import { Router } from "express";
import { z } from "zod";
import {
  requireAuth,
  requireTenant,
  type AuthedRequest,
} from "../middleware/auth.js";

export const appointmentsRouter = Router();

appointmentsRouter.use(requireAuth, requireTenant);

/**
 * Appointments API
 * ----------------
 * GET    /api/appointments      list (hydrated with client / professional / service names)
 * POST   /api/appointments      create
 * PATCH  /api/appointments/:id  update (partial)
 * DELETE /api/appointments/:id  hard delete (matches the original behavior)
 *
 * Server-side joins
 * -----------------
 * The list endpoint embeds the related rows using Supabase's PostgREST nested
 * select syntax:
 *
 *     client:clients(name),
 *     professional:professionals(name),
 *     service:services(name)
 *
 * That way the frontend receives a single array ready to render — no N+1
 * round-trips and no client-side joining. RLS on the related tables keeps
 * things safe: the per-request Supabase client uses the user JWT, so each
 * embedded select is also tenant-scoped automatically.
 *
 * Server-side derived fields
 * --------------------------
 * The frontend used to compute `end_time`, `duration` and `price` from the
 * chosen service before saving. That logic now lives here: the route fetches
 * the service, derives the three fields and persists them. This keeps prices
 * authoritative server-side and lets future clients (mobile, integrations)
 * stay dumb.
 */

const APPOINTMENT_STATUSES = [
  "agendado",
  "confirmado",
  "em_atendimento",
  "concluido",
  "cancelado",
  "nao_compareceu",
] as const;

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD");

const timeSchema = z
  .string()
  .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Hora deve estar no formato HH:mm");

const createSchema = z.object({
  client_id: z.string().uuid("Cliente inválido"),
  professional_id: z.string().uuid("Profissional inválido"),
  service_id: z.string().uuid("Serviço inválido"),
  date: dateSchema,
  start_time: timeSchema,
  status: z.enum(APPOINTMENT_STATUSES).default("agendado"),
  notes: z.string().nullish(),
});

const updateSchema = createSchema.partial();

const listQuerySchema = z.object({
  date: dateSchema.optional(),
  from: dateSchema.optional(),
  to: dateSchema.optional(),
  professional_id: z.string().uuid().optional(),
  status: z.enum(APPOINTMENT_STATUSES).optional(),
});

const SELECT_WITH_JOINS = `
  id, tenant_id, date, start_time, end_time, duration, price, status, notes,
  client_id, professional_id, service_id,
  created_at, updated_at,
  client:clients(name),
  professional:professionals(name),
  service:services(name)
`;

// GET /api/appointments
appointmentsRouter.get("/", async (req, res, next) => {
  try {
    const { supabase, tenantId } = (req as AuthedRequest).auth;
    const filters = listQuerySchema.parse(req.query);

    let query = supabase
      .from("appointments")
      .select(SELECT_WITH_JOINS)
      .eq("tenant_id", tenantId!)
      .order("date")
      .order("start_time");

    if (filters.date) query = query.eq("date", filters.date);
    if (filters.from) query = query.gte("date", filters.from);
    if (filters.to) query = query.lte("date", filters.to);
    if (filters.professional_id)
      query = query.eq("professional_id", filters.professional_id);
    if (filters.status) query = query.eq("status", filters.status);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data ?? []);
  } catch (err) {
    next(err);
  }
});

// POST /api/appointments
appointmentsRouter.post("/", async (req, res, next) => {
  try {
    const { supabase, tenantId } = (req as AuthedRequest).auth;
    const parsed = createSchema.parse(req.body);

    const service = await fetchService(supabase, parsed.service_id);
    if (!service) {
      return res.status(400).json({ error: "Serviço não encontrado" });
    }

    const start = normalizeTime(parsed.start_time);
    const end = addMinutesToTime(start, service.duration);

    const { data, error } = await supabase
      .from("appointments")
      .insert({
        tenant_id: tenantId,
        client_id: parsed.client_id,
        professional_id: parsed.professional_id,
        service_id: parsed.service_id,
        date: parsed.date,
        start_time: start,
        end_time: end,
        duration: service.duration,
        price: service.price,
        status: parsed.status,
        notes: parsed.notes?.trim() || null,
      })
      .select(SELECT_WITH_JOINS)
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/appointments/:id
appointmentsRouter.patch("/:id", async (req, res, next) => {
  try {
    const { supabase } = (req as AuthedRequest).auth;
    const parsed = updateSchema.parse(req.body);
    const payload: Record<string, unknown> = {};

    if (parsed.client_id !== undefined) payload.client_id = parsed.client_id;
    if (parsed.professional_id !== undefined)
      payload.professional_id = parsed.professional_id;
    if (parsed.date !== undefined) payload.date = parsed.date;
    if (parsed.status !== undefined) payload.status = parsed.status;
    if (parsed.notes !== undefined)
      payload.notes = parsed.notes?.trim() || null;

    // If service_id or start_time changed, recompute end_time / duration / price
    // server-side so they stay consistent with the (possibly new) service.
    const needsRecompute =
      parsed.service_id !== undefined || parsed.start_time !== undefined;

    if (needsRecompute) {
      const current = await fetchAppointment(supabase, req.params.id);
      if (!current) return res.status(404).json({ error: "Agendamento não encontrado" });

      const serviceId = parsed.service_id ?? current.service_id;
      const startRaw = parsed.start_time ?? current.start_time;
      const service = await fetchService(supabase, serviceId);
      if (!service) {
        return res.status(400).json({ error: "Serviço não encontrado" });
      }
      const start = normalizeTime(startRaw);
      payload.service_id = serviceId;
      payload.start_time = start;
      payload.end_time = addMinutesToTime(start, service.duration);
      payload.duration = service.duration;
      payload.price = service.price;
    }

    const { data, error } = await supabase
      .from("appointments")
      .update(payload)
      .eq("id", req.params.id)
      .select(SELECT_WITH_JOINS)
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/appointments/:id (hard delete — original behavior)
appointmentsRouter.delete("/:id", async (req, res, next) => {
  try {
    const { supabase } = (req as AuthedRequest).auth;
    const { error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", req.params.id);
    if (error) throw error;
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// ---------- helpers ----------

type SupabaseLike = AuthedRequest["auth"]["supabase"];

async function fetchService(supabase: SupabaseLike, id: string) {
  const { data, error } = await supabase
    .from("services")
    .select("duration, price")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as { duration: number; price: number } | null;
}

async function fetchAppointment(supabase: SupabaseLike, id: string) {
  const { data, error } = await supabase
    .from("appointments")
    .select("service_id, start_time")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as { service_id: string; start_time: string } | null;
}

function normalizeTime(t: string): string {
  // Accept HH:mm or HH:mm:ss; always store HH:mm:ss.
  return t.length === 5 ? `${t}:00` : t;
}

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${hh.toString().padStart(2, "0")}:${mm
    .toString()
    .padStart(2, "0")}:00`;
}
