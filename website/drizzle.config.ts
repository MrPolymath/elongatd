import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Get the database URL based on environment
const connectionString =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL_UNPOOLED;

if (!connectionString) {
  throw new Error(
    "No database connection string found. Please set POSTGRES_URL or DATABASE_URL environment variable."
  );
}

// Log the configuration being used (without sensitive details)
console.log("Database configuration:", {
  environment: process.env.NODE_ENV || "development",
  dbType: process.env.DB_TYPE || "local",
  usingConnectionString: !!connectionString,
});

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    connectionString,
  },
  verbose: true,
  strict: true,
} satisfies Config;
