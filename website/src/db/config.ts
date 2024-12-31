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

function getVercelConnectionString(): string {
  const { POSTGRES_URL } = process.env;

  if (!POSTGRES_URL) {
    throw new Error("Missing Vercel Postgres configuration");
  }

  return POSTGRES_URL;
}

export function getDatabaseConfig(): DatabaseConfig {
  const dbType = process.env.DB_TYPE || "local";

  return {
    connectionString:
      dbType === "vercel"
        ? getVercelConnectionString()
        : getLocalConnectionString(),
  };
}
