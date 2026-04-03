import db from "../db.server";
import {
  getPublicAppUrl,
  getPublicAppUrlSyncState,
  resolvePublicAppUrl,
} from "../config.server";

export const loader = async () => {
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

  return Response.json(
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
      databaseMode: "d1",
      resolvedDatabaseUrl: "Cloudflare D1 binding: post_purchase_db",
      resolvedDatabasePath: null,
      usingDatabaseFallback: false,
      sessionTableExists: sessionStorageReady,
      offerTableExists: sessionStorageReady,
      sessionStorageReady,
      sessionStorageError,
    },
    { status: sessionStorageReady ? 200 : 503 }
  );
};
