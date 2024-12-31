import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { getDatabaseConfig } from "./config";

// Get database configuration
const config = getDatabaseConfig();

// Create the database client
const client = postgres(config.connectionString);
export const db = drizzle(client, { schema });

// Export the schema
export { schema };
