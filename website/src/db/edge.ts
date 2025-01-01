import { drizzle } from "drizzle-orm/vercel-postgres";
import { createPool } from "@vercel/postgres";
import * as schema from "./schema";
import type { VercelPgDatabase } from "drizzle-orm/vercel-postgres";

const pool = createPool({
  connectionString: process.env.DATABASE_URL,
});

export const db: VercelPgDatabase<typeof schema> = drizzle(pool, { schema });
export { schema };
