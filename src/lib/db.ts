import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export function getSafeDatabaseError(error: unknown) {
  if (!(error instanceof Error)) {
    return { name: "UnknownError", code: "UNKNOWN", message: "Unknown database error." };
  }

  const code =
    "code" in error && typeof error.code === "string" ? error.code : "UNKNOWN";
  let message = error.message;
  const connectionString = process.env.DATABASE_URL;
  if (connectionString) {
    message = message.replaceAll(connectionString, "[redacted DATABASE_URL]");
  }
  message = message.replace(
    /(password\s*[:=]\s*)[^\s,;]+/gi,
    "$1[redacted]",
  );

  return { name: error.name, code, message };
}

export default pool;
