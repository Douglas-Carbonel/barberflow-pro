import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

export const onboardingRouter = Router();

onboardingRouter.use(requireAuth);

/**
 * Onboarding API
 * --------------
 * POST /api/onboarding
 *
 * Substitui o orquestrador de 6+ inserts que vivia em `src/pages/Onboarding.tsx`
 * por um único endpoint. O frontend chama uma vez e recebe `{ tenant_id }` —
 * ou um erro com a UI já em estado limpo (nada criado pela metade).
 *
 * Operações executadas (em ordem)
 * --------------------------------
 *   1. INSERT tenants                — barbearia em si
 *   2. UPDATE profiles SET tenant_id — vincula o usuário logado ao tenant
 *   3. INSERT user_roles             — grava o usuário como `owner`
 *   4. INSERT tenant_subscriptions   — assinatura com trial de 15 dias
 *   5. INSERT service_categories     — categoria padrão "Geral"
 *   6. INSERT services               — serviços iniciais (opcional)
 *   7. INSERT professionals          — profissionais iniciais (opcional)
 *
 * Atomicidade
 * -----------
 * O Supabase via PostgREST **não expõe transações multi-statement**, então não
 * é possível abrir um `BEGIN ... COMMIT` daqui sem usar a service-role key
 * com o driver `pg` direto (o que abriria mão da RLS) ou criar uma função
 * RPC no Postgres. Por enquanto, o endpoint usa **rollback compensatório**:
 * cada passo bem-sucedido é registrado, e em caso de falha desfazemos na
 * ordem inversa. Isso cobre o caso comum (validação, permissão negada,
 * conflito de slug) sem introduzir novos segredos.
 *
 * Quando substituirmos o Supabase por Postgres + Drizzle (Fase D do
 * MIGRATION.md), este handler vira um único `BEGIN; ... COMMIT;` real.
 *
 * Auth
 * ----
 * Usa apenas `requireAuth` (sem `requireTenant`) porque o usuário ainda não
 * tem tenant — esse endpoint é justamente o que o cria. RLS continua ativa:
 * o cliente Supabase é construído por requisição com o JWT do usuário, então
 * cada INSERT/UPDATE é avaliado pelas policies do Postgres.
 */

const TIME_REGEX = /^\d{2}:\d{2}(:\d{2})?$/;

const PLAN_VALUES = ["starter", "pro", "multi_unidade"] as const;

const barbershopSchema = z.object({
  name: z.string().trim().min(1, "Nome da barbearia é obrigatório").max(120),
  phone: z.string().trim().max(40).nullish(),
  address: z.string().trim().max(200).nullish(),
  city: z.string().trim().max(100).nullish(),
  state: z.string().trim().max(60).nullish(),
  opening_time: z
    .string()
    .regex(TIME_REGEX, "Horário de abertura deve ser HH:MM")
    .default("08:00"),
  closing_time: z
    .string()
    .regex(TIME_REGEX, "Horário de fechamento deve ser HH:MM")
    .default("20:00"),
  working_days: z
    .array(z.number().int().min(0).max(6))
    .min(1, "Selecione ao menos um dia de funcionamento")
    .default([1, 2, 3, 4, 5, 6]),
});

const serviceSchema = z.object({
  name: z.string().trim().min(1),
  price: z.number().nonnegative().default(0),
  duration: z.number().int().positive().default(30),
});

const professionalSchema = z.object({
  name: z.string().trim().min(1),
  specialty: z.string().trim().nullish(),
});

const onboardingSchema = z.object({
  barbershop: barbershopSchema,
  plan: z.enum(PLAN_VALUES).default("starter"),
  services: z.array(serviceSchema).default([]),
  professionals: z.array(professionalSchema).default([]),
});

type SupabaseLike = AuthedRequest["auth"]["supabase"];

interface RollbackTracker {
  tenantId?: string;
  profileLinked?: boolean;
  roleInserted?: boolean;
  subscriptionInserted?: boolean;
  categoryId?: string;
  serviceIds?: string[];
  professionalIds?: string[];
}

/**
 * Structured logger scoped to a single onboarding request. Every line is
 * prefixed with `[onboarding][reqId=...]` so a failed run can be grepped
 * end-to-end (start → each step → rollback events) in production logs.
 *
 * The same `requestId` is also returned to the client via the `X-Request-Id`
 * header so a user reporting a problem can quote it back to support.
 */
type Logger = ReturnType<typeof createLogger>;

function createLogger(requestId: string, userId: string) {
  const prefix = `[onboarding][reqId=${requestId}][user=${userId}]`;
  return {
    requestId,
    info(step: string, extra?: Record<string, unknown>) {
      console.log(`${prefix} ${step}`, extra ? safeJson(extra) : "");
    },
    warn(step: string, extra?: Record<string, unknown>) {
      console.warn(`${prefix} ${step}`, extra ? safeJson(extra) : "");
    },
    error(step: string, err: unknown, extra?: Record<string, unknown>) {
      console.error(
        `${prefix} ${step}`,
        { ...(extra ?? {}), error: serializeError(err) },
      );
    },
  };
}

function serializeError(err: unknown): Record<string, unknown> {
  if (err && typeof err === "object") {
    const e = err as Record<string, unknown> & { message?: string };
    return {
      message: e.message ?? String(err),
      // Supabase / PostgREST errors carry these — surface them when present.
      code: e.code,
      details: e.details,
      hint: e.hint,
      status: e.status,
    };
  }
  return { message: String(err) };
}

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

onboardingRouter.post("/", async (req, res, next) => {
  const { supabase, userId } = (req as AuthedRequest).auth;
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId, userId);
  // Surface the request id on the response so the user / frontend can
  // include it when reporting an issue.
  res.setHeader("X-Request-Id", requestId);

  const tracker: RollbackTracker = {};
  const startedAt = Date.now();

  log.info("request received");

  try {
    const parsed = onboardingSchema.parse(req.body);
    log.info("payload validated", {
      plan: parsed.plan,
      services_count: parsed.services.length,
      professionals_count: parsed.professionals.length,
    });

    // Sanity check: don't let a user accidentally onboard twice. If they
    // already have a tenant_id we 409 instead of silently orphaning data.
    const { data: currentProfile, error: profileFetchError } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .maybeSingle();
    if (profileFetchError) throw profileFetchError;
    if (currentProfile?.tenant_id) {
      log.warn("aborted: user already linked to tenant", {
        existing_tenant_id: currentProfile.tenant_id,
      });
      return res.status(409).json({
        error: "Usuário já está vinculado a uma barbearia",
        tenant_id: currentProfile.tenant_id,
        request_id: requestId,
      });
    }

    const tenantId = crypto.randomUUID();
    const slug = buildSlug(parsed.barbershop.name);
    log.info("ownership check passed", { new_tenant_id: tenantId, slug });

    // 1. Tenant
    {
      const { error } = await supabase.from("tenants").insert({
        id: tenantId,
        name: parsed.barbershop.name,
        slug,
        phone: parsed.barbershop.phone?.trim() || null,
        address: parsed.barbershop.address?.trim() || null,
        city: parsed.barbershop.city?.trim() || null,
        state: parsed.barbershop.state?.trim() || null,
        opening_time: parsed.barbershop.opening_time,
        closing_time: parsed.barbershop.closing_time,
        working_days: parsed.barbershop.working_days,
        saas_plan: parsed.plan,
      });
      if (error) throw error;
      tracker.tenantId = tenantId;
      log.info("step 1/7 ok: tenant inserted", { tenant_id: tenantId });
    }

    // 2. Profile → tenant link
    {
      const { error } = await supabase
        .from("profiles")
        .update({ tenant_id: tenantId })
        .eq("id", userId);
      if (error) throw error;
      tracker.profileLinked = true;
      log.info("step 2/7 ok: profile linked to tenant");
    }

    // 3. User role (owner)
    {
      const { error } = await supabase.from("user_roles").insert({
        user_id: userId,
        tenant_id: tenantId,
        role: "owner",
      });
      if (error) throw error;
      tracker.roleInserted = true;
      log.info("step 3/7 ok: owner role assigned");
    }

    // 4. Subscription with 15-day trial
    {
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 15);
      const { error } = await supabase.from("tenant_subscriptions").insert({
        tenant_id: tenantId,
        plan: parsed.plan,
        status: "trial",
        expires_at: trialEndsAt.toISOString(),
      });
      if (error) throw error;
      tracker.subscriptionInserted = true;
      log.info("step 4/7 ok: subscription created (trial)", {
        plan: parsed.plan,
        expires_at: trialEndsAt.toISOString(),
      });
    }

    // 5. Default category
    const validServices = parsed.services.filter((s) => s.name.trim().length);
    if (validServices.length > 0) {
      const { data: category, error } = await supabase
        .from("service_categories")
        .insert({ tenant_id: tenantId, name: "Geral" })
        .select("id")
        .single();
      if (error) throw error;
      tracker.categoryId = category.id as string;
      log.info("step 5/7 ok: default category created", {
        category_id: tracker.categoryId,
      });

      // 6. Services
      const { data: insertedServices, error: servicesError } = await supabase
        .from("services")
        .insert(
          validServices.map((s) => ({
            tenant_id: tenantId,
            category_id: tracker.categoryId,
            name: s.name.trim(),
            price: s.price,
            duration: s.duration,
          })),
        )
        .select("id");
      if (servicesError) throw servicesError;
      tracker.serviceIds = (insertedServices ?? []).map(
        (row) => row.id as string,
      );
      log.info("step 6/7 ok: services inserted", {
        count: tracker.serviceIds.length,
      });
    } else {
      log.info("step 5-6 skipped: no services to insert");
    }

    // 7. Professionals
    const validPros = parsed.professionals.filter((p) => p.name.trim().length);
    if (validPros.length > 0) {
      const { data: insertedPros, error } = await supabase
        .from("professionals")
        .insert(
          validPros.map((p) => ({
            tenant_id: tenantId,
            name: p.name.trim(),
            specialty: p.specialty?.trim() || null,
          })),
        )
        .select("id");
      if (error) throw error;
      tracker.professionalIds = (insertedPros ?? []).map(
        (row) => row.id as string,
      );
      log.info("step 7/7 ok: professionals inserted", {
        count: tracker.professionalIds.length,
      });
    } else {
      log.info("step 7 skipped: no professionals to insert");
    }

    log.info("success", {
      tenant_id: tenantId,
      duration_ms: Date.now() - startedAt,
    });
    return res
      .status(201)
      .json({ tenant_id: tenantId, request_id: requestId });
  } catch (err) {
    log.error("request failed, initiating rollback", err, {
      duration_ms: Date.now() - startedAt,
      tracker_snapshot: snapshotTracker(tracker),
    });
    // Best-effort rollback — see header comment for why this isn't a real TX.
    await rollback(supabase, userId, tracker, log);
    return next(err);
  }
});

function snapshotTracker(t: RollbackTracker) {
  return {
    tenant_id: t.tenantId ?? null,
    profile_linked: !!t.profileLinked,
    role_inserted: !!t.roleInserted,
    subscription_inserted: !!t.subscriptionInserted,
    category_id: t.categoryId ?? null,
    services_inserted: t.serviceIds?.length ?? 0,
    professionals_inserted: t.professionalIds?.length ?? 0,
  };
}

/**
 * Compensating rollback. Runs in reverse insert order so foreign-key
 * constraints don't bite. Failures inside the rollback itself are logged
 * loudly (console.error with the request id) but swallowed: the original
 * error from the request is what the client needs to see, and a noisy
 * rollback log is what the operator needs to spot orphaned rows.
 */
async function rollback(
  supabase: SupabaseLike,
  userId: string,
  tracker: RollbackTracker,
  log: Logger,
) {
  const snapshot = snapshotTracker(tracker);
  log.warn("ROLLBACK START", snapshot);

  const failures: string[] = [];
  const safeDelete = async (
    label: string,
    fn: () => PromiseLike<{ error: unknown } | unknown>,
  ) => {
    try {
      const result = (await fn()) as { error?: unknown };
      // Supabase returns { error } instead of throwing, so check both paths.
      if (result && typeof result === "object" && "error" in result && result.error) {
        failures.push(label);
        log.error(`ROLLBACK step '${label}' failed`, result.error, {
          rollback_step: label,
        });
        return;
      }
      log.info(`rollback step '${label}' ok`);
    } catch (err) {
      failures.push(label);
      log.error(`ROLLBACK step '${label}' threw`, err, {
        rollback_step: label,
      });
    }
  };

  if (tracker.professionalIds?.length) {
    await safeDelete("professionals", () =>
      supabase.from("professionals").delete().in("id", tracker.professionalIds!),
    );
  }
  if (tracker.serviceIds?.length) {
    await safeDelete("services", () =>
      supabase.from("services").delete().in("id", tracker.serviceIds!),
    );
  }
  if (tracker.categoryId) {
    await safeDelete("service_categories", () =>
      supabase
        .from("service_categories")
        .delete()
        .eq("id", tracker.categoryId!),
    );
  }
  if (tracker.subscriptionInserted && tracker.tenantId) {
    await safeDelete("tenant_subscriptions", () =>
      supabase
        .from("tenant_subscriptions")
        .delete()
        .eq("tenant_id", tracker.tenantId!),
    );
  }
  if (tracker.roleInserted && tracker.tenantId) {
    await safeDelete("user_roles", () =>
      supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("tenant_id", tracker.tenantId!),
    );
  }
  if (tracker.profileLinked) {
    await safeDelete("profiles.tenant_id", () =>
      supabase.from("profiles").update({ tenant_id: null }).eq("id", userId),
    );
  }
  if (tracker.tenantId) {
    await safeDelete("tenants", () =>
      supabase.from("tenants").delete().eq("id", tracker.tenantId!),
    );
  }

  if (failures.length === 0) {
    log.info("ROLLBACK COMPLETE: clean", snapshot);
  } else {
    // INCONSISTENCY: at least one rollback step failed. Operator needs to
    // inspect Supabase manually for orphaned rows tied to this requestId.
    log.error(
      "ROLLBACK COMPLETE WITH FAILURES — POSSIBLE ORPHANED ROWS",
      new Error(`Rollback failures: ${failures.join(", ")}`),
      { failed_steps: failures, ...snapshot },
    );
  }
}

function buildSlug(name: string): string {
  const base =
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "barbearia";
  return `${base}-${Date.now()}`;
}
