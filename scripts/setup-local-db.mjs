import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  applyLocalDatabaseDefaults,
  loadLocalEnv,
} from "./load-local-env.mjs";

loadLocalEnv();
const { mode, url: databaseUrl } = applyLocalDatabaseDefaults();
const prismaDirectory = path.resolve(process.cwd(), "prisma");
const databaseStatePath = path.join(prismaDirectory, ".local-db-state.json");

if (!databaseUrl.startsWith("file:")) {
  console.log(
    `Skipping local SQLite setup because LOCAL_DB_MODE=${mode} uses ${databaseUrl}`
  );
  process.exit(0);
}

const relativePath = databaseUrl.slice("file:".length);
const databasePath = path.isAbsolute(relativePath)
  ? relativePath
  : path.resolve(prismaDirectory, relativePath);

fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const sql = `
CREATE TABLE IF NOT EXISTS "Session" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "shop" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "isOnline" BOOLEAN NOT NULL DEFAULT 0,
  "scope" TEXT,
  "expires" DATETIME,
  "accessToken" TEXT NOT NULL,
  "userId" BIGINT
);
CREATE UNIQUE INDEX IF NOT EXISTS "Session_shop_key" ON "Session" ("shop");

CREATE TABLE IF NOT EXISTS "Offer" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "shop" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT 1,
  "triggerProductId" TEXT,
  "triggerVariantId" TEXT,
  "triggerLabel" TEXT,
  "offerProductId" TEXT NOT NULL,
  "offerVariantId" TEXT NOT NULL,
  "offerLabel" TEXT NOT NULL,
  "headline" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "acceptLabel" TEXT NOT NULL,
  "declineLabel" TEXT,
  "priority" INTEGER NOT NULL DEFAULT 100,
  "discountType" TEXT,
  "discountValue" REAL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "Offer_shop_isActive_priority_idx" ON "Offer" ("shop", "isActive", "priority");
`;

const result = spawnSync("sqlite3", [databasePath], {
  input: sql,
  stdio: ["pipe", "inherit", "inherit"],
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

const verify = spawnSync(
  "sqlite3",
  [
    databasePath,
    "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('Session', 'Offer') ORDER BY name;",
  ],
  { encoding: "utf8" }
);

if (verify.status !== 0) {
  process.exit(verify.status ?? 1);
}

const tables = verify.stdout
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean);
const sessionTableExists = tables.includes("Session");
const offerTableExists = tables.includes("Offer");

fs.writeFileSync(
  databaseStatePath,
  JSON.stringify(
    {
      databaseUrl,
      resolvedPath: databasePath,
      sessionTableExists,
      offerTableExists,
      updatedAt: new Date().toISOString(),
    },
    null,
    2
  ) + "\n",
  "utf8"
);

if (!sessionTableExists || !offerTableExists) {
  console.error(
    `Table verification failed for ${databasePath} (Session=${sessionTableExists}, Offer=${offerTableExists})`
  );
  process.exit(1);
}

console.log(`Resolved bootstrap DB path: ${databasePath}`);
console.log(`Session table exists: ${sessionTableExists}`);
console.log(`Offer table exists: ${offerTableExists}`);
console.log(`Ensured local SQLite session table at ${databasePath}`);
