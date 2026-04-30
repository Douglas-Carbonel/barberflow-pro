import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema.js";

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL ?? "";

if (!DATABASE_URL) {
  console.warn(
    "[api][db] Missing DATABASE_URL. Drizzle queries will fail until it's set.",
  );
}

/**
 * One process-wide connection pool.
 *
 * Notes:
 *   - max=10 is fine for a single Node process serving a small SaaS. Bump
 *     it (and Postgres `max_connections`) when we scale horizontally.
 *   - SSL is opt-in: when DATABASE_URL targets a managed DB (RDS, Neon,
 *     Supabase) you typically need it; on a local socket it would break.
 *     We turn it on automatically when the URL contains `sslmode=require`
 *     OR when the env var DB_SSL=true is set.
 */
const wantsSsl =
  /[\?&]sslmode=require/i.test(DATABASE_URL) ||
  process.env.DB_SSL === "true";

export const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  ssl: wantsSsl ? { rejectUnauthorized: false } : undefined,
});

pool.on("error", (err) => {
  // Surface idle-client errors so they don't get swallowed.
  console.error("[api][db] idle client error:", err);
});

export const db = drizzle(pool, { schema });

export type DB = typeof db;
