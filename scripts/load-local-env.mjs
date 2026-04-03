import fs from "node:fs";
import path from "node:path";

const DEFAULT_SQLITE_DATABASE_URL = "file:./dev.sqlite";
const PLACEHOLDER_DATABASE_TOKENS = [
  "HOST",
  "REAL_HOST",
  "USER",
  "REAL_USER",
  "PASSWORD",
  "REAL_PASSWORD",
  "DBNAME",
  "REAL_DB",
];

function normalizeValue(value) {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

export function loadLocalEnv(cwd = process.cwd()) {
  const envPath = path.join(cwd, ".env");

  if (!fs.existsSync(envPath)) {
    return;
  }

  const contents = fs.readFileSync(envPath, "utf8");

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = normalizeValue(trimmed.slice(separatorIndex + 1));

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function normalizeDbMode(value) {
  return String(value || "").trim().toLowerCase() === "postgres"
    ? "postgres"
    : "sqlite";
}

function looksLikePlaceholderDatabaseUrl(value) {
  if (!value) return false;

  return PLACEHOLDER_DATABASE_TOKENS.some((token) => value.includes(token));
}

export function resolveLocalDatabaseConfig(env = process.env) {
  const mode = normalizeDbMode(env.LOCAL_DB_MODE);
  const sqliteUrl = env.LOCAL_SQLITE_DATABASE_URL || DEFAULT_SQLITE_DATABASE_URL;
  const rawDatabaseUrl = String(env.DATABASE_URL || "").trim();
  const isPostgresUrl = /^postgres(ql)?:\/\//.test(rawDatabaseUrl);
  const postgresEligible =
    mode === "postgres" &&
    isPostgresUrl &&
    !looksLikePlaceholderDatabaseUrl(rawDatabaseUrl);

  if (postgresEligible) {
    return {
      mode: "postgres",
      url: rawDatabaseUrl,
      usingFallback: false,
      reason: "explicit-postgres",
    };
  }

  return {
    mode: "sqlite",
    url: sqliteUrl,
    usingFallback: mode === "postgres" || Boolean(rawDatabaseUrl),
    reason: mode === "postgres" ? "invalid-postgres-fallback" : "local-default",
  };
}

export function applyLocalDatabaseDefaults(env = process.env) {
  const database = resolveLocalDatabaseConfig(env);

  env.LOCAL_DB_MODE = database.mode;
  env.DATABASE_URL = database.url;
  env.EFFECTIVE_DATABASE_URL = database.url;

  return database;
}
