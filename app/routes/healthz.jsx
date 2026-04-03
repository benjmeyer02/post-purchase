import { json } from "@remix-run/node";
import db from "../db.server";
import {
  assertLocalDatabaseState,
  getPublicAppUrl,
  getPublicAppUrlSyncState,
  getResolvedDatabaseLocation,
  redactDatabaseUrl,
  resolvePublicAppUrl,
} from "../config.server";

export const loader = async () => {
  const database = getResolvedDatabaseLocation();
  const bootstrap = assertLocalDatabaseState();
  const publicAppUrlResolution = resolvePublicAppUrl();
  let sessionStorageReady = false;
  let sessionStorageError = null;

  try {
    await db.session.count();
    sessionStorageReady = true;
  } catch (error) {
    sessionStorageError =
      error instanceof Error ? error.message : "Unknown Prisma error";
  }

  return json(
    {
      publicAppUrl: getPublicAppUrl() || null,
      publicAppUrlSource: publicAppUrlResolution.source || null,
      publicAppUrlCandidates: publicAppUrlResolution.candidates,
      publicAppUrlEnv: process.env.PUBLIC_APP_URL || null,
      shopifyAppUrlEnv: process.env.SHOPIFY_APP_URL || null,
      hostEnv: process.env.HOST || null,
      extensionAppUrl: (
        await import(
          "../../extensions/my-post-purchase-ui-extension/src/app-url.js"
        )
      ).APP_URL,
      publicUrlSyncState: getPublicAppUrlSyncState(),
      databaseMode: database.mode,
      resolvedDatabaseUrl: redactDatabaseUrl(database.url),
      resolvedDatabasePath: database.resolvedPath,
      usingDatabaseFallback: database.usingFallback,
      sessionTableExists: Boolean(bootstrap.bootstrapState?.sessionTableExists),
      offerTableExists: Boolean(bootstrap.bootstrapState?.offerTableExists),
      sessionStorageReady,
      sessionStorageError,
    },
    { status: sessionStorageReady ? 200 : 503 }
  );
};
