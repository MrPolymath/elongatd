import { drizzle } from "drizzle-orm/node-postgres";
import { drizzle as drizzleVercel } from "drizzle-orm/vercel-postgres";
import { createPool } from "@vercel/postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const isLocal = process.env.USE_LOCAL_DB === "true";

let db;

if (isLocal) {
  // Use pg for local connections
  const pool = new Pool({
    host: process.env.LOCAL_DB_HOST,
    port: parseInt(process.env.LOCAL_DB_PORT || "5432"),
    user: process.env.LOCAL_DB_USER,
    password: process.env.LOCAL_DB_PASS,
    database: process.env.LOCAL_DB_NAME,
  });

  db = drizzle(pool, { schema });
} else {
  // Use @vercel/postgres for remote connections
  const pool = createPool({
    connectionString: process.env.DATABASE_URL,
  });

  db = drizzleVercel(pool, { schema });
}

export { db, schema };
