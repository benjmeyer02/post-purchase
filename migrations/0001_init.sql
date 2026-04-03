CREATE TABLE IF NOT EXISTS "Session" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "shop" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "isOnline" INTEGER NOT NULL DEFAULT 0,
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
  "isActive" INTEGER NOT NULL DEFAULT 1,
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

CREATE INDEX IF NOT EXISTS "Offer_shop_isActive_priority_idx"
ON "Offer" ("shop", "isActive", "priority");
