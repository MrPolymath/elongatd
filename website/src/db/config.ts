interface DatabaseConfig {
  connectionString: string;
}

function getLocalConnectionString(): string {
  const {
    LOCAL_DB_HOST,
    LOCAL_DB_PORT,
    LOCAL_DB_USER,
    LOCAL_DB_PASS,
    LOCAL_DB_NAME,
  } = process.env;

  if (
    !LOCAL_DB_HOST ||
    !LOCAL_DB_PORT ||
    !LOCAL_DB_USER ||
    !LOCAL_DB_PASS ||
    !LOCAL_DB_NAME
  ) {
    throw new Error("Missing local database configuration");
  }

  return `postgres://${LOCAL_DB_USER}:${LOCAL_DB_PASS}@${LOCAL_DB_HOST}:${LOCAL_DB_PORT}/${LOCAL_DB_NAME}`;
}

function getNeonConnectionString(): string {
  // Try different connection string formats that Neon provides
  const connectionString =
    process.env.POSTGRES_URL || // Vercel Postgres format
    process.env.DATABASE_URL || // Standard format
    process.env.POSTGRES_URL_NON_POOLING || // Non-pooling option
    process.env.DATABASE_URL_UNPOOLED; // Unpooled option

  if (!connectionString) {
    throw new Error(
      "Missing Neon Postgres configuration. Please provide either POSTGRES_URL, DATABASE_URL, or their unpooled variants."
    );
  }

  return connectionString;
}

export function getDatabaseConfig(): DatabaseConfig {
  const environment = process.env.NODE_ENV || "development";
  const dbType =
    process.env.DB_TYPE || (environment === "production" ? "neon" : "local");

  return {
    connectionString:
      dbType === "local"
        ? getLocalConnectionString()
        : getNeonConnectionString(),
  };
}
