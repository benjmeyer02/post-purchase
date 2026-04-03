import fs from "node:fs";
import path from "node:path";
import { getPublicAppUrlSyncState, resolvePublicAppUrl } from "./config.server";

const MANIFEST_PATH = path.join(
  process.cwd(),
  ".shopify",
  "dev-bundle",
  "manifest.json"
);
const EXTENSION_DIST_PATH = path.join(
  process.cwd(),
  "extensions",
  "my-post-purchase-ui-extension",
  "dist",
  "my-post-purchase-ui-extension.js"
);
const EXTENSION_APP_URL_PATH = path.join(
  process.cwd(),
  "extensions",
  "my-post-purchase-ui-extension",
  "src",
  "app-url.js"
);
const BUILD_OUTPUT_PATH = path.join(process.cwd(), "build", "index.js");
const ACTIVE_URL_SCAN_PATHS = [
  path.join(process.cwd(), ".env"),
  path.join(process.cwd(), ".shopify", "public-url-sync.json"),
  EXTENSION_APP_URL_PATH,
  EXTENSION_DIST_PATH,
  BUILD_OUTPUT_PATH,
  MANIFEST_PATH,
];
const FORBIDDEN_URL_TOKENS = [
  "https://example.com",
  "example.com",
  "app.local.invalid",
  "public-app-url-required.invalid",
];

function getRuntimeState() {
  if (!global.__postPurchaseRuntimeState) {
    global.__postPurchaseRuntimeState = {
      apiOffer: null,
      apiSignChangeset: null,
    };
  }

  return global.__postPurchaseRuntimeState;
}

export function markPostPurchaseRuntimeHit(type, payload = {}) {
  const state = getRuntimeState();
  state[type] = {
    seenAt: new Date().toISOString(),
    payload,
  };
}

function readJsonFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function readTextFile(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

function extractAppUrl(fileContents) {
  const match = fileContents?.match(/APP_URL = "([^"]+)"/);
  return match?.[1] || null;
}

function getExtensionModuleInfo() {
  const manifest = readJsonFile(MANIFEST_PATH);
  const module = manifest?.modules?.find(
    (entry) => entry.type === "post_purchase_ui"
  );

  return {
    manifestExists: Boolean(manifest),
    modulePresent: Boolean(module),
    module: module
      ? {
          type: module.type,
          handle: module.handle,
          uid: module.uid,
          target: module.target,
        }
      : null,
  };
}

function getPlaceholderScan() {
  const matches = ACTIVE_URL_SCAN_PATHS.flatMap((filePath) => {
    const contents = readTextFile(filePath);

    if (!contents) {
      return [];
    }

    const matchedTokens = FORBIDDEN_URL_TOKENS.filter((token) =>
      contents.includes(token)
    );

    if (matchedTokens.length === 0) {
      return [];
    }

    return [
      {
        file: path.relative(process.cwd(), filePath),
        tokens: matchedTokens,
      },
    ];
  });

  return {
    hasForbiddenTokens: matches.length > 0,
    matches,
  };
}

function getExtensionBuildInfo(expectedUrl) {
  const extensionSource = readTextFile(EXTENSION_APP_URL_PATH);
  const extensionBundle = readTextFile(EXTENSION_DIST_PATH);
  const syncState = getPublicAppUrlSyncState();
  const sourceAppUrl = extractAppUrl(extensionSource);

  return {
    sourceAppUrl,
    bundleExists: Boolean(extensionBundle),
    bundleContainsExpectedUrl: Boolean(
      extensionBundle && expectedUrl && extensionBundle.includes(expectedUrl)
    ),
    bundleContainsShouldRenderLog: Boolean(
      extensionBundle && extensionBundle.includes("ShouldRender entered")
    ),
    bundleContainsRenderLog: Boolean(
      extensionBundle && extensionBundle.includes("Render entered")
    ),
    syncState,
  };
}

async function getPostPurchaseSelectionStatus(admin) {
  const query = `#graphql
    query PostPurchaseSelectionStatus {
      app {
        isPostPurchaseAppInUse
      }
    }
  `;

  try {
    const response = await admin.graphql(query);
    const payload = await response.json();

    return {
      isPostPurchaseAppInUse:
        payload?.data?.app?.isPostPurchaseAppInUse ?? null,
      errors: payload?.errors || null,
    };
  } catch (error) {
    return {
      isPostPurchaseAppInUse: null,
      errors: [error instanceof Error ? error.message : "Unknown error"],
    };
  }
}

export async function getPostPurchaseDiagnostics({ admin }) {
  const selectionStatus = await getPostPurchaseSelectionStatus(admin);
  const runtimeState = getRuntimeState();
  const publicAppUrl = resolvePublicAppUrl();
  const build = getExtensionBuildInfo(publicAppUrl.url);
  const placeholderScan = getPlaceholderScan();

  return {
    extension: getExtensionModuleInfo(),
    build,
    selection: selectionStatus,
    recentRequests: {
      apiOffer: runtimeState.apiOffer,
      apiSignChangeset: runtimeState.apiSignChangeset,
    },
    publicUrl: {
      resolvedAppUrl: publicAppUrl.url,
      source: publicAppUrl.source,
      candidates: publicAppUrl.candidates,
      extensionAppUrl: build.sourceAppUrl,
      extensionMatchesAppUrl:
        Boolean(publicAppUrl.url) && build.sourceAppUrl === publicAppUrl.url,
      placeholderScan,
      lastSyncedAt: build.syncState?.syncedAt || null,
      syncSource: build.syncState?.source || null,
    },
  };
}
