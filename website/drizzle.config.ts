import type { Config } from "drizzle-kit";
import { getDatabaseConfig } from "./src/db/config";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const config = getDatabaseConfig();

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    connectionString: config.connectionString,
  },
  verbose: true,
  strict: true,
} satisfies Config;
