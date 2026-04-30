import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Schema do BarberFlow em Drizzle.
 *
 * Decisões importantes:
 *   - Mantemos os MESMOS nomes de tabela e coluna do Supabase original. Isso
 *     deixa a migração de cada rota (Fase S3) ser "trocar quem executa a
 *     query" e nada mais — sem renomear nada no frontend ou nos handlers.
 *   - `profiles.id` originalmente era FK para `auth.users` (do Supabase).
 *     Como vamos construir nossa própria autenticação na Fase S5, hoje ele
 *     fica como uuid PK sem FK. Na S5 adicionaremos a tabela `users` e o
 *     vínculo passa a ser `profiles.id -> users.id`.
 *   - Tabelas de features ainda não migradas (payments, commissions, goals,
 *     memberships) ficam para uma fase futura — adicioná-las aqui sem rotas
 *     usando só polui o schema.
 */

// ---------- Enums ----------

export const appRoleEnum = pgEnum("app_role", [
  "super_admin",
  "owner",
  "manager",
  "professional",
  "receptionist",
]);

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "agendado",
  "confirmado",
  "em_atendimento",
  "concluido",
  "cancelado",
  "nao_compareceu",
]);

export const saasPlanEnum = pgEnum("saas_plan", [
  "starter",
  "pro",
  "multi_unidade",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "trial",
  "active",
  "past_due",
  "canceled",
]);

// ---------- Tabelas ----------

export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  saasPlan: saasPlanEnum("saas_plan").notNull().default("starter"),
  openingTime: time("opening_time").notNull().default("08:00"),
  closingTime: time("closing_time").notNull().default("20:00"),
  workingDays: integer("working_days")
    .array()
    .notNull()
    .default(sql`ARRAY[1,2,3,4,5,6]::integer[]`),
  isActive: boolean("is_active").notNull().default(true),
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const profiles = pgTable("profiles", {
  // PK só. Na S5 viraremos FK para users.id.
  id: uuid("id").primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id, {
    onDelete: "set null",
  }),
  fullName: text("full_name").notNull(),
  avatarUrl: text("avatar_url"),
  phone: text("phone"),
  email: text("email"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const userRoles = pgTable(
  "user_roles",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    role: appRoleEnum("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    // Um usuário só pode ter um papel por tenant.
    userTenantUnique: uniqueIndex("user_roles_user_tenant_unique").on(
      table.userId,
      table.tenantId,
    ),
  }),
);

export const tenantSubscriptions = pgTable("tenant_subscriptions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  plan: saasPlanEnum("plan").notNull(),
  status: subscriptionStatusEnum("status").notNull().default("trial"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const serviceCategories = pgTable("service_categories", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const services = pgTable("services", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id").references(() => serviceCategories.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  duration: integer("duration").notNull(), // minutos
  commissionRate: numeric("commission_rate", { precision: 5, scale: 2 }),
  isCombo: boolean("is_combo").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const professionals = pgTable("professionals", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => profiles.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  specialty: text("specialty"),
  commissionRate: numeric("commission_rate", { precision: 5, scale: 2 })
    .notNull()
    .default("0"),
  workStart: time("work_start").notNull().default("08:00"),
  workEnd: time("work_end").notNull().default("20:00"),
  workingDays: integer("working_days")
    .array()
    .notNull()
    .default(sql`ARRAY[1,2,3,4,5,6]::integer[]`),
  isActive: boolean("is_active").notNull().default(true),
  rating: numeric("rating", { precision: 3, scale: 2 }).notNull().default("5.00"),
  avatarUrl: text("avatar_url"),
  phone: text("phone"),
  email: text("email"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  avatarUrl: text("avatar_url"),
  birthday: date("birthday"),
  notes: text("notes"),
  preferences: text("preferences"),
  favoriteProfessionalId: uuid("favorite_professional_id").references(
    () => professionals.id,
    { onDelete: "set null" },
  ),
  tags: text("tags")
    .array()
    .notNull()
    .default(sql`ARRAY[]::text[]`),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const appointments = pgTable("appointments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "restrict" }),
  professionalId: uuid("professional_id")
    .notNull()
    .references(() => professionals.id, { onDelete: "restrict" }),
  serviceId: uuid("service_id")
    .notNull()
    .references(() => services.id, { onDelete: "restrict" }),
  date: date("date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  duration: integer("duration").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  status: appointmentStatusEnum("status").notNull().default("agendado"),
  notes: text("notes"),
  cancellationReason: text("cancellation_reason"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
