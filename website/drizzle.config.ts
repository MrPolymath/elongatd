import type { Config } from "drizzle-kit";
import { config } from "dotenv";
import { resolve } from "path";
import { readFileSync } from "fs";

// Load the appropriate .env file based on the DRIZZLE_ENV environment variable
const envFile = process.env.DRIZZLE_ENV === "prod" ? ".env" : ".env.local";
const envPath = resolve(process.cwd(), envFile);
console.log("Loading environment from:", envPath);

// Read the file contents directly
try {
  const fileContents = readFileSync(envPath, "utf8");
  console.log(
    "File contents:",
    fileContents
      .split("\n")
      .map((line) => {
        // Redact sensitive values
        if (line.startsWith("DATABASE_URL=")) {
          const url = new URL(line.split("=")[1]);
          if (url.password) url.password = "****";
          return `DATABASE_URL=${url.toString()}`;
        }
        if (line.includes("KEY=") || line.includes("SECRET=")) {
          return line.split("=")[0] + "=****";
        }
        return line;
      })
      .join("\n")
  );
} catch (error) {
  console.error("Error reading file:", error);
}

const result = config({ path: envPath });
const loadedEnv = result.parsed || {};

console.log("Env loading result:", {
  error: result.error?.message,
  parsed: result.parsed ? Object.keys(result.parsed) : null,
  loadedDatabaseUrl: loadedEnv.DATABASE_URL ? "present" : "missing",
});

const environment = process.env.DRIZZLE_ENV || "development";
const usingConnectionString = true;

// Function to safely log database URL by redacting sensitive parts
function getRedactedUrl(url: string) {
  try {
    const dbUrl = new URL(url);
    // Redact password if it exists
    if (dbUrl.password) {
      dbUrl.password = "****";
    }
    return dbUrl.toString();
  } catch {
    return "Invalid database URL";
  }
}

// Use the DATABASE_URL from the loaded env file
const databaseUrl = loadedEnv.DATABASE_URL || process.env.DATABASE_URL;

console.log("Database configuration:", {
  environment,
  envFile,
  usingConnectionString,
  databaseUrl: databaseUrl ? getRedactedUrl(databaseUrl) : "not set",
  nodeEnv: process.env.NODE_ENV,
  cwd: process.cwd(),
});

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    connectionString: databaseUrl!,
  },
} satisfies Config;
