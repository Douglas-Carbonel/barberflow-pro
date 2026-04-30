import "dotenv/config";
import type { Config } from "drizzle-kit";

/**
 * Drizzle Kit reads this to:
 *   - generate migration SQL files (`npm run db:generate`)
 *   - apply migrations to the live database (`npm run db:migrate`)
 *   - launch a browser DB inspector (`npm run db:studio`)
 *
 * It needs DATABASE_URL exported in the environment. The `dotenv/config`
 * import above loads it from `.env` so the CLI works without any flag.
 */
export default {
  schema: "./server/db/schema.ts",
  out: "./server/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
} satisfies Config;
