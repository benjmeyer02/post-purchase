import fs from "node:fs";
import path from "node:path";

const DEFAULT_SQLITE_DATABASE_URL = "file:./dev.sqlite";
const PRISMA_DIRECTORY = path.resolve(process.cwd(), "prisma");
const LOCAL_DB_STATE_PATH = path.join(PRISMA_DIRECTORY, ".local-db-state.json");
const PUBLIC_URL_SYNC_STATE_PATH = path.join(
  process.cwd(),
  ".shopify",
  "public-url-sync.json"
);
const SHOPIFY_APP_CONFIG_PATH = path.join(process.cwd(), "shopify.app.toml");
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
const FORBIDDEN_PUBLIC_APP_HOSTS = new Set(["example.com"]);
const FORBIDDEN_PUBLIC_APP_SUFFIXES = [".invalid"];
const PUBLIC_APP_URL_SOURCES = {
  SHOPIFY_DEV_PREVIEW_URL: "SHOPIFY_DEV_PREVIEW_URL",
  PUBLIC_APP_URL: "PUBLIC_APP_URL",
  SHOPIFY_APP_CONFIG: "SHOPIFY_APP_CONFIG",
  SHOPIFY_APP_URL: "SHOPIFY_APP_URL",
  HOST: "HOST",
};

function getForbiddenPublicUrlReason(url) {
  if (FORBIDDEN_PUBLIC_APP_HOSTS.has(url.hostname)) {
    return `placeholder-host:${url.hostname}`;
  }

  if (
    FORBIDDEN_PUBLIC_APP_SUFFIXES.some((suffix) =>
      url.hostname.endsWith(suffix)
    )
  ) {
    return `placeholder-host:${url.hostname}`;
  }

  return null;
}

export function normalizePublicAppUrl(value) {
  if (!value) {
    return { normalized: null, reason: "missing" };
  }

  try {
    const url = new URL(String(value).trim());
    const forbiddenReason = getForbiddenPublicUrlReason(url);

    if (forbiddenReason) {
      return { normalized: null, reason: forbiddenReason };
    }

    return {
      normalized: url.toString().replace(/\/$/, ""),
      reason: null,
    };
  } catch {
    return { normalized: null, reason: "invalid-url" };
  }
}

function createPublicAppUrlCandidate(key, raw, metadata = {}) {
  const value = String(raw || "").trim();
  const { normalized, reason } = normalizePublicAppUrl(value);

  return {
    key,
    raw: value,
    normalized,
    reason,
    selected: false,
    ...metadata,
  };
}

function getCommittedShopifyAppConfig() {
  try {
    const contents = fs.readFileSync(SHOPIFY_APP_CONFIG_PATH, "utf8");
    const applicationUrlMatch = contents.match(
      /^\s*application_url\s*=\s*"([^"]+)"/m
    );

    return {
      filePath: SHOPIFY_APP_CONFIG_PATH,
      applicationUrl: applicationUrlMatch?.[1] || "",
    };
  } catch {
    return {
      filePath: SHOPIFY_APP_CONFIG_PATH,
      applicationUrl: "",
    };
  }
}

export function getCommittedPublicAppUrlCandidate() {
  const config = getCommittedShopifyAppConfig();

  return createPublicAppUrlCandidate(
    PUBLIC_APP_URL_SOURCES.SHOPIFY_APP_CONFIG,
    config.applicationUrl,
    {
      filePath: config.filePath,
    }
  );
}

export function resolvePublicAppUrl(env = process.env) {
  const shopifyDevPreviewCandidate = createPublicAppUrlCandidate(
    PUBLIC_APP_URL_SOURCES.SHOPIFY_DEV_PREVIEW_URL,
    env.SHOPIFY_DEV_PREVIEW_URL
  );
  const publicAppUrlCandidate = createPublicAppUrlCandidate(
    PUBLIC_APP_URL_SOURCES.PUBLIC_APP_URL,
    env.PUBLIC_APP_URL
  );
  const committedConfigCandidate = getCommittedPublicAppUrlCandidate();
  const shopifyAppUrlCandidate = createPublicAppUrlCandidate(
    PUBLIC_APP_URL_SOURCES.SHOPIFY_APP_URL,
    env.SHOPIFY_APP_URL
  );
  const hostCandidate = createPublicAppUrlCandidate(
    PUBLIC_APP_URL_SOURCES.HOST,
    env.HOST
  );
  const preferShopifyRuntimeUrl =
    shopifyAppUrlCandidate.normalized &&
    shopifyAppUrlCandidate.normalized !== publicAppUrlCandidate.normalized;
  const preferShopifyDevPreviewUrl =
    shopifyDevPreviewCandidate.normalized &&
    shopifyDevPreviewCandidate.normalized !== publicAppUrlCandidate.normalized;
  const candidates = preferShopifyDevPreviewUrl
    ? [
        shopifyDevPreviewCandidate,
        shopifyAppUrlCandidate,
        publicAppUrlCandidate,
        committedConfigCandidate,
        hostCandidate,
      ]
    : preferShopifyRuntimeUrl
    ? [
        shopifyAppUrlCandidate,
        publicAppUrlCandidate,
        committedConfigCandidate,
        hostCandidate,
      ]
    : [
        publicAppUrlCandidate,
        committedConfigCandidate,
        shopifyAppUrlCandidate,
        hostCandidate,
      ];

  const selectedCandidate = candidates.find(
    (candidate) => candidate.normalized
  );

  if (selectedCandidate) {
    selectedCandidate.selected = true;
  }

  return {
    url: selectedCandidate?.normalized || null,
    source: selectedCandidate?.key || null,
    candidates,
  };
}

export function getPublicAppUrl() {
  return resolvePublicAppUrl().url;
}

export function resolveExtensionAppUrl(env = process.env) {
  const publicAppUrlCandidate = createPublicAppUrlCandidate(
    PUBLIC_APP_URL_SOURCES.PUBLIC_APP_URL,
    env.PUBLIC_APP_URL
  );
  const committedConfigCandidate = getCommittedPublicAppUrlCandidate();
  const shopifyAppUrlCandidate = createPublicAppUrlCandidate(
    PUBLIC_APP_URL_SOURCES.SHOPIFY_APP_URL,
    env.SHOPIFY_APP_URL
  );
  const hostCandidate = createPublicAppUrlCandidate(
    PUBLIC_APP_URL_SOURCES.HOST,
    env.HOST
  );
  const candidates = [
    publicAppUrlCandidate,
    committedConfigCandidate,
    shopifyAppUrlCandidate,
    hostCandidate,
  ];

  const selectedCandidate = candidates.find(
    (candidate) => candidate.normalized
  );

  if (selectedCandidate) {
    selectedCandidate.selected = true;
  }

  return {
    url: selectedCandidate?.normalized || null,
    source: selectedCandidate?.key || null,
    candidates,
  };
}

function buildPublicAppUrlErrorMessage(context, resolution) {
  const candidateSummary = resolution.candidates
    .map((candidate) => {
      const displayValue = candidate.raw || "(not set)";
      const status = candidate.normalized
        ? `valid -> ${candidate.normalized}`
        : candidate.reason || "invalid";
      const sourceDetail = candidate.filePath
        ? ` from ${path.relative(process.cwd(), candidate.filePath)}`
        : "";

      return `${candidate.key}=${displayValue}${sourceDetail} [${status}]`;
    })
    .join("; ");

  return `Missing valid public app URL for ${context}. Set PUBLIC_APP_URL to a stable hostname, commit a valid application_url in shopify.app.toml for deploys, or let Shopify CLI provide SHOPIFY_APP_URL during \`shopify app dev\`. Placeholder hosts like example.com or *.invalid are rejected. Checked: ${candidateSummary}`;
}

export function getRequiredPublicAppUrl(
  context = "runtime",
  env = process.env
) {
  const resolution = resolvePublicAppUrl(env);

  if (!resolution.url) {
    throw new Error(buildPublicAppUrlErrorMessage(context, resolution));
  }

  return resolution.url;
}

export function getRequiredExtensionAppUrl(
  context = "extension runtime",
  env = process.env
) {
  const resolution = resolveExtensionAppUrl(env);

  if (!resolution.url) {
    throw new Error(buildPublicAppUrlErrorMessage(context, resolution));
  }

  return resolution.url;
}

export function getPublicAppUrlSyncState() {
  try {
    return JSON.parse(fs.readFileSync(PUBLIC_URL_SYNC_STATE_PATH, "utf8"));
  } catch {
    return null;
  }
}

export function getPublicUrlSyncStatePath() {
  return PUBLIC_URL_SYNC_STATE_PATH;
}

function normalizeDbMode(value) {
  return String(value || "")
    .trim()
    .toLowerCase() === "postgres"
    ? "postgres"
    : "sqlite";
}

function looksLikePlaceholderDatabaseUrl(value) {
  if (!value) return false;

  return PLACEHOLDER_DATABASE_TOKENS.some((token) => value.includes(token));
}

export function getScopes() {
  return (process.env.SCOPES || "read_products,write_products")
    .split(",")
    .map((scope) => scope.trim())
    .filter(Boolean);
}

export function resolveDatabaseConfig(env = process.env) {
  const mode = normalizeDbMode(env.LOCAL_DB_MODE);
  const sqliteUrl =
    env.LOCAL_SQLITE_DATABASE_URL || DEFAULT_SQLITE_DATABASE_URL;
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

export function resolveSqliteDatabasePath(databaseUrl) {
  if (!databaseUrl?.startsWith("file:")) {
    return null;
  }

  const rawPath = databaseUrl.slice("file:".length);

  if (path.isAbsolute(rawPath)) {
    return rawPath;
  }

  return path.resolve(PRISMA_DIRECTORY, rawPath);
}

export function getResolvedDatabaseLocation(env = process.env) {
  const database = resolveDatabaseConfig(env);
  return {
    ...database,
    resolvedPath:
      database.mode === "sqlite"
        ? resolveSqliteDatabasePath(database.url)
        : null,
  };
}

export function applyLocalDatabaseDefaults(env = process.env) {
  const database = getResolvedDatabaseLocation(env);

  env.LOCAL_DB_MODE = database.mode;
  env.DATABASE_URL = database.url;
  env.EFFECTIVE_DATABASE_URL = database.url;
  if (database.resolvedPath) {
    env.EFFECTIVE_DATABASE_PATH = database.resolvedPath;
  } else {
    delete env.EFFECTIVE_DATABASE_PATH;
  }

  return database;
}

export function redactDatabaseUrl(value) {
  if (!value) return "Not set";

  if (value.startsWith("file:")) {
    return value;
  }

  try {
    const url = new URL(value);
    const auth = url.username || url.password ? "***:***@" : "";
    return `${url.protocol}//${auth}${url.host}${url.pathname}`;
  } catch {
    return value;
  }
}

export function readLocalDatabaseState() {
  try {
    return JSON.parse(fs.readFileSync(LOCAL_DB_STATE_PATH, "utf8"));
  } catch {
    return null;
  }
}

export function assertLocalDatabaseState(env = process.env) {
  const database = getResolvedDatabaseLocation(env);

  if (database.mode !== "sqlite") {
    return { database, bootstrapState: null };
  }

  const bootstrapState = readLocalDatabaseState();

  if (!bootstrapState) {
    throw new Error(
      `Missing local DB bootstrap state at ${LOCAL_DB_STATE_PATH}. Run npm run db:setup first.`
    );
  }

  if (bootstrapState.resolvedPath !== database.resolvedPath) {
    throw new Error(
      `Local DB mismatch: runtime=${database.resolvedPath} bootstrap=${bootstrapState.resolvedPath}`
    );
  }

  if (!bootstrapState.sessionTableExists) {
    throw new Error(
      `Session table missing in local SQLite DB at ${database.resolvedPath}. Run npm run db:setup.`
    );
  }

  if (bootstrapState.offerTableExists === false) {
    throw new Error(
      `Offer table missing in local SQLite DB at ${database.resolvedPath}. Run npm run db:setup.`
    );
  }

  return { database, bootstrapState };
}

export function getLocalDatabaseStatePath() {
  return LOCAL_DB_STATE_PATH;
}
