import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load the appropriate .env file based on the DRIZZLE_ENV environment variable
const envFile = process.env.DRIZZLE_ENV === "prod" ? ".env.local" : ".env";
dotenv.config({ path: envFile });

const environment = process.env.DRIZZLE_ENV || "development";
const dbType = process.env.DB_TYPE || "local";
const usingConnectionString = true;

console.log("Database configuration:", {
  environment,
  dbType,
  usingConnectionString,
});

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
