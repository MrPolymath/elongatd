import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as dotenv from "dotenv";
import { join } from "path";

// Load environment variables
dotenv.config();

// Get the database URL
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

async function main() {
  console.log("🚀 Initializing database...");

  // Create the database client for migrations
  const migrationClient = postgres(connectionString!, { max: 1 });
  const db = drizzle(migrationClient);

  try {
    // Run migrations
    await migrate(db, { migrationsFolder: join(__dirname, "../drizzle") });
    console.log("✅ Database migrations completed successfully!");
  } catch (error) {
    console.error("❌ Error running migrations:", error);
    process.exit(1);
  } finally {
    await migrationClient.end();
  }
}

main();
