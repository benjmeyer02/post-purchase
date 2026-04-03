var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf, __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: !0 });
}, __copyProps = (to, from, except, desc) => {
  if (from && typeof from == "object" || typeof from == "function")
    for (let key of __getOwnPropNames(from))
      !__hasOwnProp.call(to, key) && key !== except && __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: !0 }) : target,
  mod
)), __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: !0 }), mod);

// extensions/my-post-purchase-ui-extension/src/app-url.js
var app_url_exports = {};
__export(app_url_exports, {
  APP_URL: () => APP_URL
});
var APP_URL, init_app_url = __esm({
  "extensions/my-post-purchase-ui-extension/src/app-url.js"() {
    "use strict";
    APP_URL = "https://reverse-centers-imperial-reforms.trycloudflare.com";
  }
});

// <stdin>
var stdin_exports = {};
__export(stdin_exports, {
  assets: () => assets_manifest_default,
  assetsBuildDirectory: () => assetsBuildDirectory,
  entry: () => entry,
  future: () => future,
  mode: () => mode,
  publicPath: () => publicPath,
  routes: () => routes
});
module.exports = __toCommonJS(stdin_exports);

// app/entry.server.jsx
var entry_server_exports = {};
__export(entry_server_exports, {
  default: () => handleRequest
});
var import_stream = require("stream"), import_server = require("react-dom/server"), import_react = require("@remix-run/react"), import_node2 = require("@remix-run/node"), import_isbot = require("isbot");

// app/shopify.server.js
var import_node = require("@shopify/shopify-app-remix/adapters/node"), import_shopify_app_remix = require("@shopify/shopify-app-remix"), import_shopify_app_session_storage_prisma = require("@shopify/shopify-app-session-storage-prisma");

// app/db.server.js
var import_client = require("@prisma/client");

// app/config.server.js
var import_node_fs = __toESM(require("node:fs")), import_node_path = __toESM(require("node:path")), DEFAULT_SQLITE_DATABASE_URL = "file:./dev.sqlite", PRISMA_DIRECTORY = import_node_path.default.resolve(process.cwd(), "prisma"), LOCAL_DB_STATE_PATH = import_node_path.default.join(PRISMA_DIRECTORY, ".local-db-state.json"), PUBLIC_URL_SYNC_STATE_PATH = import_node_path.default.join(
  process.cwd(),
  ".shopify",
  "public-url-sync.json"
), PLACEHOLDER_DATABASE_TOKENS = [
  "HOST",
  "REAL_HOST",
  "USER",
  "REAL_USER",
  "PASSWORD",
  "REAL_PASSWORD",
  "DBNAME",
  "REAL_DB"
], PUBLIC_APP_URL_ENV_PRIORITY = [
  "PUBLIC_APP_URL",
  "SHOPIFY_APP_URL",
  "HOST"
], FORBIDDEN_PUBLIC_APP_HOSTS = /* @__PURE__ */ new Set(["example.com"]), FORBIDDEN_PUBLIC_APP_SUFFIXES = [".invalid"];
function getForbiddenPublicUrlReason(url) {
  return FORBIDDEN_PUBLIC_APP_HOSTS.has(url.hostname) ? `placeholder-host:${url.hostname}` : FORBIDDEN_PUBLIC_APP_SUFFIXES.some(
    (suffix) => url.hostname.endsWith(suffix)
  ) ? `placeholder-host:${url.hostname}` : null;
}
function normalizePublicAppUrl(value) {
  if (!value)
    return { normalized: null, reason: "missing" };
  try {
    let url = new URL(String(value).trim()), forbiddenReason = getForbiddenPublicUrlReason(url);
    return forbiddenReason ? { normalized: null, reason: forbiddenReason } : {
      normalized: url.toString().replace(/\/$/, ""),
      reason: null
    };
  } catch {
    return { normalized: null, reason: "invalid-url" };
  }
}
function resolvePublicAppUrl(env = process.env) {
  let candidates = PUBLIC_APP_URL_ENV_PRIORITY.map((key) => {
    let raw = String(env[key] || "").trim(), { normalized, reason } = normalizePublicAppUrl(raw);
    return {
      key,
      raw,
      normalized,
      reason,
      selected: !1
    };
  }), selectedCandidate = candidates.find(
    (candidate) => candidate.normalized
  );
  return selectedCandidate && (selectedCandidate.selected = !0), {
    url: selectedCandidate?.normalized || null,
    source: selectedCandidate?.key || null,
    candidates
  };
}
function getPublicAppUrl() {
  return resolvePublicAppUrl().url;
}
function buildPublicAppUrlErrorMessage(context, resolution) {
  let candidateSummary = resolution.candidates.map((candidate) => {
    let displayValue = candidate.raw || "(not set)", status = candidate.normalized ? `valid -> ${candidate.normalized}` : candidate.reason || "invalid";
    return `${candidate.key}=${displayValue} [${status}]`;
  }).join("; ");
  return `Missing valid public app URL for ${context}. Set PUBLIC_APP_URL to a stable hostname or let Shopify CLI provide SHOPIFY_APP_URL during \`shopify app dev\`. Placeholder hosts like example.com or *.invalid are rejected. Checked: ${candidateSummary}`;
}
function getRequiredPublicAppUrl(context = "runtime", env = process.env) {
  let resolution = resolvePublicAppUrl(env);
  if (!resolution.url)
    throw new Error(buildPublicAppUrlErrorMessage(context, resolution));
  return resolution.url;
}
function getPublicAppUrlSyncState() {
  try {
    return JSON.parse(import_node_fs.default.readFileSync(PUBLIC_URL_SYNC_STATE_PATH, "utf8"));
  } catch {
    return null;
  }
}
function normalizeDbMode(value) {
  return String(value || "").trim().toLowerCase() === "postgres" ? "postgres" : "sqlite";
}
function looksLikePlaceholderDatabaseUrl(value) {
  return value ? PLACEHOLDER_DATABASE_TOKENS.some((token) => value.includes(token)) : !1;
}
function getScopes() {
  return (process.env.SCOPES || "read_products,write_products").split(",").map((scope) => scope.trim()).filter(Boolean);
}
function resolveDatabaseConfig(env = process.env) {
  let mode2 = normalizeDbMode(env.LOCAL_DB_MODE), sqliteUrl = env.LOCAL_SQLITE_DATABASE_URL || DEFAULT_SQLITE_DATABASE_URL, rawDatabaseUrl = String(env.DATABASE_URL || "").trim(), isPostgresUrl = /^postgres(ql)?:\/\//.test(rawDatabaseUrl);
  return mode2 === "postgres" && isPostgresUrl && !looksLikePlaceholderDatabaseUrl(rawDatabaseUrl) ? {
    mode: "postgres",
    url: rawDatabaseUrl,
    usingFallback: !1,
    reason: "explicit-postgres"
  } : {
    mode: "sqlite",
    url: sqliteUrl,
    usingFallback: mode2 === "postgres" || Boolean(rawDatabaseUrl),
    reason: mode2 === "postgres" ? "invalid-postgres-fallback" : "local-default"
  };
}
function resolveSqliteDatabasePath(databaseUrl) {
  if (!databaseUrl?.startsWith("file:"))
    return null;
  let rawPath = databaseUrl.slice(5);
  return import_node_path.default.isAbsolute(rawPath) ? rawPath : import_node_path.default.resolve(PRISMA_DIRECTORY, rawPath);
}
function getResolvedDatabaseLocation(env = process.env) {
  let database3 = resolveDatabaseConfig(env);
  return {
    ...database3,
    resolvedPath: database3.mode === "sqlite" ? resolveSqliteDatabasePath(database3.url) : null
  };
}
function applyLocalDatabaseDefaults(env = process.env) {
  let database3 = getResolvedDatabaseLocation(env);
  return env.LOCAL_DB_MODE = database3.mode, env.DATABASE_URL = database3.url, env.EFFECTIVE_DATABASE_URL = database3.url, database3.resolvedPath ? env.EFFECTIVE_DATABASE_PATH = database3.resolvedPath : delete env.EFFECTIVE_DATABASE_PATH, database3;
}
function redactDatabaseUrl(value) {
  if (!value)
    return "Not set";
  if (value.startsWith("file:"))
    return value;
  try {
    let url = new URL(value), auth = url.username || url.password ? "***:***@" : "";
    return `${url.protocol}//${auth}${url.host}${url.pathname}`;
  } catch {
    return value;
  }
}
function readLocalDatabaseState() {
  try {
    return JSON.parse(import_node_fs.default.readFileSync(LOCAL_DB_STATE_PATH, "utf8"));
  } catch {
    return null;
  }
}
function assertLocalDatabaseState(env = process.env) {
  let database3 = getResolvedDatabaseLocation(env);
  if (database3.mode !== "sqlite")
    return { database: database3, bootstrapState: null };
  let bootstrapState = readLocalDatabaseState();
  if (!bootstrapState)
    throw new Error(
      `Missing local DB bootstrap state at ${LOCAL_DB_STATE_PATH}. Run npm run db:setup first.`
    );
  if (bootstrapState.resolvedPath !== database3.resolvedPath)
    throw new Error(
      `Local DB mismatch: runtime=${database3.resolvedPath} bootstrap=${bootstrapState.resolvedPath}`
    );
  if (!bootstrapState.sessionTableExists)
    throw new Error(
      `Session table missing in local SQLite DB at ${database3.resolvedPath}. Run npm run db:setup.`
    );
  if (bootstrapState.offerTableExists === !1)
    throw new Error(
      `Offer table missing in local SQLite DB at ${database3.resolvedPath}. Run npm run db:setup.`
    );
  return { database: database3, bootstrapState };
}

// app/db.server.js
var database = applyLocalDatabaseDefaults(), bootstrapCheck = assertLocalDatabaseState();
database.mode === "sqlite" && (console.log(`Resolved runtime DB path: ${database.resolvedPath}`), console.log(
  `Resolved bootstrap DB path: ${bootstrapCheck.bootstrapState?.resolvedPath}`
));
var db;
db = new import_client.PrismaClient();
var db_server_default = db;

// app/shopify.server.js
var publicAppUrl = resolvePublicAppUrl(), appUrl = getRequiredPublicAppUrl("Shopify app initialization"), database2 = getResolvedDatabaseLocation(), prismaSessionStorage = new import_shopify_app_session_storage_prisma.PrismaSessionStorage(db_server_default);
prismaSessionStorage.ready.then(() => {
  console.log("session storage ready: true");
}).catch((error) => {
  console.error("session storage ready: false"), console.error(error);
});
console.log(`session storage db: ${database2.resolvedPath || database2.url}`);
console.log(`public app url: ${appUrl} (${publicAppUrl.source || "unknown"})`);
var shopify = (0, import_shopify_app_remix.shopifyApp)({
  apiKey: process.env.SHOPIFY_API_KEY || "",
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: import_shopify_app_remix.LATEST_API_VERSION,
  scopes: getScopes(),
  appUrl,
  authPathPrefix: "/auth",
  sessionStorage: prismaSessionStorage,
  distribution: import_shopify_app_remix.AppDistribution.AppStore,
  webhooks: {
    APP_UNINSTALLED: {
      deliveryMethod: import_shopify_app_remix.DeliveryMethod.Http,
      callbackUrl: "/webhooks"
    },
    CUSTOMERS_DATA_REQUEST: {
      deliveryMethod: import_shopify_app_remix.DeliveryMethod.Http,
      callbackUrl: "/webhooks"
    },
    CUSTOMERS_REDACT: {
      deliveryMethod: import_shopify_app_remix.DeliveryMethod.Http,
      callbackUrl: "/webhooks"
    },
    SHOP_REDACT: {
      deliveryMethod: import_shopify_app_remix.DeliveryMethod.Http,
      callbackUrl: "/webhooks"
    }
  },
  hooks: {
    afterAuth: async ({ session }) => {
      shopify.registerWebhooks({ session });
    }
  },
  future: {
    v3_webhookAdminContext: !0,
    v3_authenticatePublic: !0
  },
  ...process.env.SHOP_CUSTOM_DOMAIN ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] } : {}
});
var apiVersion = import_shopify_app_remix.LATEST_API_VERSION, addDocumentResponseHeaders = shopify.addDocumentResponseHeaders, authenticate = shopify.authenticate, unauthenticated = shopify.unauthenticated, login = shopify.login, registerWebhooks = shopify.registerWebhooks, sessionStorage = shopify.sessionStorage;

// app/entry.server.jsx
var import_jsx_runtime = require("react/jsx-runtime"), ABORT_DELAY = 5e3;
async function handleRequest(request, responseStatusCode, responseHeaders, remixContext) {
  addDocumentResponseHeaders(request, responseHeaders);
  let userAgent = request.headers.get("user-agent"), callbackName = (0, import_isbot.isbot)(userAgent ?? "") ? "onAllReady" : "onShellReady";
  return new Promise((resolve, reject) => {
    let { pipe, abort } = (0, import_server.renderToPipeableStream)(
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        import_react.RemixServer,
        {
          context: remixContext,
          url: request.url,
          abortDelay: ABORT_DELAY
        }
      ),
      {
        [callbackName]: () => {
          let body = new import_stream.PassThrough(), stream = (0, import_node2.createReadableStreamFromReadable)(body);
          responseHeaders.set("Content-Type", "text/html"), resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          ), pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500, console.error(error);
        }
      }
    );
    setTimeout(abort, ABORT_DELAY);
  });
}

// app/root.jsx
var root_exports = {};
__export(root_exports, {
  default: () => App
});
var import_react2 = require("@remix-run/react"), import_jsx_runtime2 = require("react/jsx-runtime");
function App() {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("html", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("head", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("meta", { charSet: "utf-8" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("meta", { name: "viewport", content: "width=device-width,initial-scale=1" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_react2.Meta, {}),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_react2.Links, {})
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("body", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_react2.Outlet, {}),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_react2.ScrollRestoration, {}),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_react2.LiveReload, {}),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_react2.Scripts, {})
    ] })
  ] });
}

// app/routes/api.post-purchase-debug.jsx
var api_post_purchase_debug_exports = {};
__export(api_post_purchase_debug_exports, {
  loader: () => loader
});
var import_node3 = require("@remix-run/node");

// app/post-purchase-debug.server.js
var import_node_fs2 = __toESM(require("node:fs")), import_node_path2 = __toESM(require("node:path"));
var MANIFEST_PATH = import_node_path2.default.join(
  process.cwd(),
  ".shopify",
  "dev-bundle",
  "manifest.json"
), EXTENSION_DIST_PATH = import_node_path2.default.join(
  process.cwd(),
  "extensions",
  "my-post-purchase-ui-extension",
  "dist",
  "my-post-purchase-ui-extension.js"
), EXTENSION_APP_URL_PATH = import_node_path2.default.join(
  process.cwd(),
  "extensions",
  "my-post-purchase-ui-extension",
  "src",
  "app-url.js"
), BUILD_OUTPUT_PATH = import_node_path2.default.join(process.cwd(), "build", "index.js"), ACTIVE_URL_SCAN_PATHS = [
  import_node_path2.default.join(process.cwd(), ".env"),
  import_node_path2.default.join(process.cwd(), ".shopify", "public-url-sync.json"),
  EXTENSION_APP_URL_PATH,
  EXTENSION_DIST_PATH,
  BUILD_OUTPUT_PATH,
  MANIFEST_PATH
], FORBIDDEN_URL_TOKENS = [
  "https://example.com",
  "example.com",
  "app.local.invalid",
  "public-app-url-required.invalid"
];
function getRuntimeState() {
  return global.__postPurchaseRuntimeState || (global.__postPurchaseRuntimeState = {
    apiOffer: null,
    apiSignChangeset: null
  }), global.__postPurchaseRuntimeState;
}
function markPostPurchaseRuntimeHit(type, payload = {}) {
  let state = getRuntimeState();
  state[type] = {
    seenAt: (/* @__PURE__ */ new Date()).toISOString(),
    payload
  };
}
function readJsonFile(filePath) {
  try {
    return JSON.parse(import_node_fs2.default.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}
function readTextFile(filePath) {
  try {
    return import_node_fs2.default.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}
function extractAppUrl(fileContents) {
  return fileContents?.match(/APP_URL = "([^"]+)"/)?.[1] || null;
}
function getExtensionModuleInfo() {
  let manifest = readJsonFile(MANIFEST_PATH), module2 = manifest?.modules?.find(
    (entry2) => entry2.type === "post_purchase_ui"
  );
  return {
    manifestExists: Boolean(manifest),
    modulePresent: Boolean(module2),
    module: module2 ? {
      type: module2.type,
      handle: module2.handle,
      uid: module2.uid,
      target: module2.target
    } : null
  };
}
function getPlaceholderScan() {
  let matches = ACTIVE_URL_SCAN_PATHS.flatMap((filePath) => {
    let contents = readTextFile(filePath);
    if (!contents)
      return [];
    let matchedTokens = FORBIDDEN_URL_TOKENS.filter(
      (token) => contents.includes(token)
    );
    return matchedTokens.length === 0 ? [] : [
      {
        file: import_node_path2.default.relative(process.cwd(), filePath),
        tokens: matchedTokens
      }
    ];
  });
  return {
    hasForbiddenTokens: matches.length > 0,
    matches
  };
}
function getExtensionBuildInfo(expectedUrl) {
  let extensionSource = readTextFile(EXTENSION_APP_URL_PATH), extensionBundle = readTextFile(EXTENSION_DIST_PATH), syncState = getPublicAppUrlSyncState();
  return {
    sourceAppUrl: extractAppUrl(extensionSource),
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
    syncState
  };
}
async function getPostPurchaseSelectionStatus(admin) {
  let query = `#graphql
    query PostPurchaseSelectionStatus {
      app {
        isPostPurchaseAppInUse
      }
    }
  `;
  try {
    let payload = await (await admin.graphql(query)).json();
    return {
      isPostPurchaseAppInUse: payload?.data?.app?.isPostPurchaseAppInUse ?? null,
      errors: payload?.errors || null
    };
  } catch (error) {
    return {
      isPostPurchaseAppInUse: null,
      errors: [error instanceof Error ? error.message : "Unknown error"]
    };
  }
}
async function getPostPurchaseDiagnostics({ admin }) {
  let selectionStatus = await getPostPurchaseSelectionStatus(admin), runtimeState = getRuntimeState(), publicAppUrl2 = resolvePublicAppUrl(), build = getExtensionBuildInfo(publicAppUrl2.url), placeholderScan = getPlaceholderScan();
  return {
    extension: getExtensionModuleInfo(),
    build,
    selection: selectionStatus,
    recentRequests: {
      apiOffer: runtimeState.apiOffer,
      apiSignChangeset: runtimeState.apiSignChangeset
    },
    publicUrl: {
      resolvedAppUrl: publicAppUrl2.url,
      source: publicAppUrl2.source,
      candidates: publicAppUrl2.candidates,
      extensionAppUrl: build.sourceAppUrl,
      extensionMatchesAppUrl: Boolean(publicAppUrl2.url) && build.sourceAppUrl === publicAppUrl2.url,
      placeholderScan,
      lastSyncedAt: build.syncState?.syncedAt || null,
      syncSource: build.syncState?.source || null
    }
  };
}

// app/routes/api.post-purchase-debug.jsx
var loader = async ({ request }) => {
  let { admin } = await authenticate.admin(request), diagnostics = await getPostPurchaseDiagnostics({ admin });
  return (0, import_node3.json)(diagnostics);
};

// app/routes/api.sign-changeset.jsx
var api_sign_changeset_exports = {};
__export(api_sign_changeset_exports, {
  action: () => action,
  loader: () => loader2
});
var import_node4 = require("@remix-run/node"), import_uuid = require("uuid"), import_jsonwebtoken = __toESM(require("jsonwebtoken"));

// app/offer.server.js
var LOG_PREFIX = "[post-purchase]";
function getShopDomainFromSessionToken(sessionToken) {
  let dest = sessionToken?.dest?.replace(/^https?:\/\//, "");
  return (sessionToken?.input_data?.shop?.domain || dest || "").replace(/\/$/, "");
}
function getInitialLineItemsFromSessionToken(sessionToken) {
  return (sessionToken?.input_data?.initialPurchase?.lineItems ?? []).map(
    (lineItem, index) => ({
      index,
      quantity: lineItem?.quantity ?? null,
      title: lineItem?.title || null,
      productId: normalizeProductId(lineItem?.product?.id),
      variantId: normalizeVariantId(lineItem?.variant?.id)
    })
  );
}
function normalizeProductId(productId) {
  return productId ? String(productId).startsWith("gid://shopify/Product/") ? String(productId) : `gid://shopify/Product/${productId}` : null;
}
function normalizeVariantId(variantId) {
  return variantId ? String(variantId).startsWith("gid://shopify/ProductVariant/") ? String(variantId) : `gid://shopify/ProductVariant/${variantId}` : null;
}
function buildDiscount(offer) {
  return !offer.discountType || offer.discountValue == null ? void 0 : {
    value: offer.discountType === "fixed_amount" ? Number(offer.discountValue).toFixed(2) : Number(offer.discountValue),
    valueType: offer.discountType,
    title: offer.discountType === "fixed_amount" ? `$${Number(offer.discountValue).toFixed(2)} off` : `${Number(offer.discountValue)}% off`
  };
}
function logRuntime(event, payload) {
  try {
    console.log(`${LOG_PREFIX} ${event} ${JSON.stringify(payload)}`);
  } catch (error) {
    console.log(`${LOG_PREFIX} ${event}`, payload, error);
  }
}
function buildLineItemLookup(lineItems = []) {
  return lineItems.map((lineItem) => ({
    index: lineItem.index ?? null,
    quantity: lineItem.quantity ?? null,
    title: lineItem.title ?? null,
    productId: normalizeProductId(lineItem.productId),
    variantId: normalizeVariantId(lineItem.variantId)
  }));
}
function evaluateOfferMatch(offer, lineItems) {
  for (let lineItem of lineItems) {
    if (offer.triggerVariantId && lineItem.variantId === offer.triggerVariantId)
      return {
        matched: !0,
        reason: "matched-trigger-variant",
        matchedLineItem: lineItem
      };
    if (offer.triggerProductId && lineItem.productId === offer.triggerProductId && (!offer.triggerVariantId || lineItem.variantId === offer.triggerVariantId))
      return {
        matched: !0,
        reason: offer.triggerVariantId ? "matched-trigger-product-and-variant" : "matched-trigger-product",
        matchedLineItem: lineItem
      };
  }
  return {
    matched: !1,
    reason: offer.triggerVariantId ? "no-line-item-matched-trigger-variant" : "no-line-item-matched-trigger-product",
    matchedLineItem: null
  };
}
async function resolveActiveOffersForCheckout({
  accessToken,
  lineItems,
  shopDomain,
  referenceId = null
}) {
  let normalizedLineItems = buildLineItemLookup(lineItems), debug = {
    referenceId,
    shopDomain,
    lineItems: normalizedLineItems,
    offerMatches: [],
    matchedOfferIds: [],
    reason: null
  };
  if (!accessToken || !shopDomain)
    return debug.reason = "missing-access-token-or-shop", { offers: [], debug };
  if (!normalizedLineItems.some(
    (lineItem) => lineItem.productId || lineItem.variantId
  ))
    return debug.reason = "missing-line-items", { offers: [], debug };
  let offers = await db_server_default.offer.findMany({
    where: {
      shop: shopDomain,
      isActive: !0
    },
    orderBy: [{ priority: "asc" }, { updatedAt: "desc" }]
  });
  debug.offerMatches = offers.map((offer) => {
    let match = evaluateOfferMatch(offer, normalizedLineItems);
    return {
      offerId: offer.id,
      triggerProductId: offer.triggerProductId,
      triggerVariantId: offer.triggerVariantId,
      reason: match.reason,
      matched: match.matched,
      matchedLineItem: match.matchedLineItem
    };
  });
  let matchedOffers = offers.filter(
    (offer) => debug.offerMatches.some(
      (match) => match.offerId === offer.id && match.matched
    )
  );
  return debug.matchedOfferIds = matchedOffers.map((offer) => offer.id), debug.reason = matchedOffers.length > 0 ? "matched-active-offers" : "no-active-offers-matched", {
    offers: (await Promise.all(
      matchedOffers.map(async (offer) => {
        let variant = await getVariantDetails({
          accessToken,
          shopDomain,
          variantId: offer.offerVariantId
        });
        if (!variant?.id || !variant?.product)
          return null;
        let variantID = String(variant.id).split("/").pop(), discount = buildDiscount(offer);
        return {
          id: offer.id,
          title: offer.headline,
          productTitle: variant.product.title,
          productImageURL: variant.product.featuredMedia?.preview?.image?.url || "",
          productDescription: offer.description.split(/\r?\n/).map((line) => line.trim()).filter(Boolean),
          originalPrice: variant.price,
          discountedPrice: variant.price,
          acceptLabel: offer.acceptLabel,
          declineLabel: offer.declineLabel || "Decline this offer",
          changes: [
            {
              type: "add_variant",
              variantID,
              quantity: 1,
              ...discount ? { discount } : {}
            }
          ]
        };
      })
    )).filter(Boolean),
    debug
  };
}
async function getVariantDetails({ accessToken, shopDomain, variantId }) {
  return (await fetchGraphQL({
    accessToken,
    query: `#graphql
    query PostPurchaseVariant($variantId: ID!) {
      productVariant(id: $variantId) {
        product {
          description
          title
          featuredMedia {
            preview {
              image {
                url
              }
            }
          }
        }
        title
        price
        id
      }
    }
  `,
    shopDomain,
    variables: { variantId }
  }))?.data?.productVariant || null;
}
async function fetchGraphQL({
  accessToken,
  query,
  shopDomain,
  variables = {}
}) {
  let response = await fetch(
    `https://${shopDomain}/admin/api/${apiVersion}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken
      },
      body: JSON.stringify({ query, variables })
    }
  ), payload = await response.json();
  return (!response.ok || payload?.errors?.length) && logRuntime("graphql-error", {
    shopDomain,
    status: response.status,
    variables,
    errors: payload?.errors || null
  }), payload;
}
function getSelectedOffer(offers, offerId) {
  return offers.find((offer) => offer.id === offerId) || null;
}

// app/routes/api.sign-changeset.jsx
var LOG_PREFIX2 = "[post-purchase]", loader2 = async ({ request }) => {
  let { cors } = await authenticate.public.checkout(request);
  return cors(new Response());
}, action = async ({ request }) => {
  let { cors, sessionToken } = await authenticate.public.checkout(request), body = await request.json(), offerId = body.offerId, shop = getShopDomainFromSessionToken(sessionToken), lineItems = getInitialLineItemsFromSessionToken(sessionToken), referenceId = body.referenceId || null;
  if (console.log(
    `${LOG_PREFIX2} api.sign-changeset.request ${JSON.stringify({
      referenceId,
      offerId,
      shop,
      lineItems
    })}`
  ), markPostPurchaseRuntimeHit("apiSignChangeset", {
    referenceId,
    offerId,
    shop,
    lineItems
  }), !offerId || !shop || lineItems.length === 0)
    return console.log(
      `${LOG_PREFIX2} api.sign-changeset.skip ${JSON.stringify({
        referenceId,
        offerId,
        shop,
        reason: "missing-changeset-context"
      })}`
    ), cors(
      (0, import_node4.json)(
        {
          error: "Missing changeset context",
          debug: {
            referenceId,
            offerId,
            shopDomain: shop,
            lineItems,
            reason: "missing-changeset-context"
          }
        },
        { status: 400 }
      )
    );
  let accessToken = (await db_server_default.session.findUnique({
    where: { shop },
    select: { accessToken: !0 }
  }))?.accessToken;
  if (!accessToken)
    return console.log(
      `${LOG_PREFIX2} api.sign-changeset.error ${JSON.stringify({
        referenceId,
        offerId,
        shop,
        reason: "missing-offline-session"
      })}`
    ), cors(
      (0, import_node4.json)(
        {
          error: `No offline session found for ${shop}`,
          debug: {
            referenceId,
            offerId,
            shopDomain: shop,
            lineItems,
            reason: "missing-offline-session"
          }
        },
        { status: 404 }
      )
    );
  let result = await resolveActiveOffersForCheckout({
    accessToken,
    lineItems,
    shopDomain: shop,
    referenceId
  }), selectedOffer = getSelectedOffer(result.offers, offerId);
  if (!selectedOffer?.changes?.length)
    return console.log(
      `${LOG_PREFIX2} api.sign-changeset.error ${JSON.stringify({
        referenceId,
        offerId,
        shop,
        reason: "offer-not-found",
        matchedOfferIds: result.debug.matchedOfferIds
      })}`
    ), cors(
      (0, import_node4.json)(
        {
          error: "Offer not found",
          debug: {
            ...result.debug,
            offerId,
            reason: "offer-not-found"
          }
        },
        { status: 404 }
      )
    );
  let payload = {
    iss: process.env.SHOPIFY_API_KEY,
    jti: (0, import_uuid.v4)(),
    iat: Math.floor(Date.now() / 1e3),
    sub: body.referenceId,
    changes: selectedOffer.changes
  }, token = import_jsonwebtoken.default.sign(payload, process.env.SHOPIFY_API_SECRET);
  return console.log(
    `${LOG_PREFIX2} api.sign-changeset.result ${JSON.stringify({
      referenceId,
      offerId,
      shop,
      changesCount: selectedOffer.changes.length
    })}`
  ), cors((0, import_node4.json)({ token }));
};

// app/routes/app.additional.jsx
var app_additional_exports = {};
__export(app_additional_exports, {
  default: () => AdditionalPage,
  loader: () => loader3
});
var import_node5 = require("@remix-run/node"), loader3 = async () => (0, import_node5.redirect)("/app");
function AdditionalPage() {
  return null;
}

// app/routes/app._index.jsx
var app_index_exports = {};
__export(app_index_exports, {
  action: () => action2,
  default: () => Index,
  loader: () => loader4
});
var import_node_fs3 = __toESM(require("node:fs")), import_node_path3 = __toESM(require("node:path")), import_toml = __toESM(require("toml")), import_node_crypto = require("node:crypto"), import_node6 = require("@remix-run/node"), import_react3 = require("@remix-run/react"), import_react4 = require("react"), import_polaris = require("@shopify/polaris");

// app/catalog.server.js
var PRODUCTS_QUERY = `#graphql
  query AdminOfferProducts {
    products(first: 50, sortKey: TITLE) {
      edges {
        node {
          id
          title
          featuredMedia {
            preview {
              image {
                url
              }
            }
          }
          variants(first: 20) {
            edges {
              node {
                id
                title
                price
              }
            }
          }
        }
      }
    }
  }
`;
async function loadCatalog(admin) {
  let products = ((await (await admin.graphql(PRODUCTS_QUERY)).json())?.data?.products?.edges ?? []).map((edge) => edge?.node).filter(Boolean).map((product) => ({
    id: product.id,
    title: product.title,
    imageUrl: product.featuredMedia?.preview?.image?.url || "",
    variants: (product.variants?.edges ?? []).map((edge) => edge?.node).filter(Boolean).map((variant) => ({
      id: variant.id,
      title: variant.title,
      price: variant.price,
      productId: product.id,
      productTitle: product.title,
      label: variant.title && variant.title !== "Default Title" ? `${product.title} - ${variant.title}` : product.title
    }))
  })), productOptions = products.map((product) => ({
    label: product.title,
    value: product.id
  })), variantOptions = products.flatMap(
    (product) => product.variants.map((variant) => ({
      label: variant.title && variant.title !== "Default Title" ? `${product.title} - ${variant.title} (${variant.price})` : `${product.title} (${variant.price})`,
      value: variant.id,
      productId: product.id,
      productTitle: product.title,
      variantTitle: variant.title
    }))
  ), productMap = new Map(products.map((product) => [product.id, product])), variantMap = new Map(variantOptions.map((variant) => [variant.value, variant]));
  return { products, productOptions, variantOptions, productMap, variantMap };
}

// app/routes/app._index.jsx
var import_jsx_runtime3 = require("react/jsx-runtime");
function readConfigFiles() {
  let root = process.cwd();
  return import_node_fs3.default.readdirSync(root).filter((file) => /^shopify\.app.*\.toml$/.test(file)).sort().map((file) => {
    let contents = import_node_fs3.default.readFileSync(import_node_path3.default.join(root, file), "utf8"), parsed = import_toml.default.parse(contents);
    return {
      file,
      applicationUrl: parsed.application_url || null,
      devStoreUrl: parsed.build?.dev_store_url || null,
      webhookApiVersion: parsed.webhooks?.api_version || null
    };
  });
}
function offerToJson(offer) {
  return {
    ...offer,
    createdAt: offer.createdAt.toISOString(),
    updatedAt: offer.updatedAt.toISOString()
  };
}
function normalizeOptionalString(value) {
  let normalized = String(value || "").trim();
  return normalized || null;
}
function parseInteger(value, fallback) {
  let parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}
function parseFloatValue(value) {
  if (value == null || value === "")
    return null;
  let parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}
function validateOfferInput(formData, catalog) {
  let triggerType = formData.get("triggerType") || "product", triggerTargetId = String(formData.get("triggerTargetId") || ""), offerVariantId = String(formData.get("offerVariantId") || ""), discountType = String(formData.get("discountType") || "none"), errors = {}, productMap = catalog.productMap, variantMap = catalog.variantMap, name = String(formData.get("name") || "").trim(), headline = String(formData.get("headline") || "").trim(), description = String(formData.get("description") || "").trim(), acceptLabel = String(formData.get("acceptLabel") || "").trim(), declineLabel = normalizeOptionalString(formData.get("declineLabel")), priority = parseInteger(formData.get("priority"), 100), isActive = String(formData.get("isActive") || "false") === "true", discountValue = parseFloatValue(formData.get("discountValue"));
  name || (errors.name = "Enter an internal name to help merchants identify this offer."), headline || (errors.headline = "Add the upsell headline shown after checkout."), description || (errors.description = "Add concise supporting copy for the offer."), acceptLabel || (errors.acceptLabel = "Add the primary CTA label.");
  let triggerProductId = null, triggerVariantId = null, triggerLabel = null;
  if (triggerType === "variant") {
    let triggerVariant = variantMap.get(triggerTargetId);
    triggerVariant ? (triggerVariantId = triggerVariant.value, triggerProductId = triggerVariant.productId, triggerLabel = triggerVariant.label) : errors.triggerTargetId = "Choose which purchased variant should trigger this offer.";
  } else {
    let triggerProduct = productMap.get(triggerTargetId);
    triggerProduct ? (triggerProductId = triggerProduct.id, triggerLabel = triggerProduct.title) : errors.triggerTargetId = "Choose which purchased product should trigger this offer.";
  }
  let offerVariant = variantMap.get(offerVariantId);
  return offerVariant || (errors.offerVariantId = "Choose which product variant to offer post-purchase."), discountType !== "none" && (discountValue == null || discountValue <= 0) && (errors.discountValue = "Enter a discount value greater than zero."), Object.keys(errors).length > 0 ? { errors } : {
    values: {
      id: normalizeOptionalString(formData.get("id")) || (0, import_node_crypto.randomUUID)(),
      name,
      isActive,
      triggerProductId,
      triggerVariantId,
      triggerLabel,
      offerProductId: offerVariant.productId,
      offerVariantId: offerVariant.value,
      offerLabel: offerVariant.label,
      headline,
      description,
      acceptLabel,
      declineLabel,
      priority,
      discountType: discountType === "none" ? null : discountType,
      discountValue: discountType === "none" ? null : discountValue
    }
  };
}
var loader4 = async ({ request }) => {
  let { admin, session } = await authenticate.admin(request), publicAppUrl2 = resolvePublicAppUrl(), database3 = getResolvedDatabaseLocation(), bootstrap = assertLocalDatabaseState(), [catalog, offers, sessions] = await Promise.all([
    loadCatalog(admin),
    db_server_default.offer.findMany({
      where: { shop: session.shop },
      orderBy: [{ priority: "asc" }, { updatedAt: "desc" }]
    }),
    db_server_default.session.findMany({
      select: { shop: !0 },
      orderBy: { shop: "asc" }
    })
  ]), sessionStorageReady = !1, sessionStorageError = null;
  try {
    await db_server_default.session.count(), sessionStorageReady = !0;
  } catch (error) {
    sessionStorageError = error instanceof Error ? error.message : "Unknown Prisma error";
  }
  let { APP_URL: extensionAppUrl } = await Promise.resolve().then(() => (init_app_url(), app_url_exports)), diagnostics = await getPostPurchaseDiagnostics({ admin });
  return (0, import_node6.json)({
    shop: session.shop,
    offers: offers.map(offerToJson),
    productOptions: catalog.productOptions,
    variantOptions: catalog.variantOptions,
    activeAppUrl: publicAppUrl2.url || "",
    publicAppUrlSource: publicAppUrl2.source || "",
    hostValue: process.env.HOST || "",
    publicAppUrlEnv: process.env.PUBLIC_APP_URL || "",
    shopifyAppUrlEnv: process.env.SHOPIFY_APP_URL || "",
    extensionAppUrl,
    databaseMode: database3.mode,
    databaseUrl: redactDatabaseUrl(database3.url),
    resolvedDatabasePath: database3.resolvedPath || "",
    usingDatabaseFallback: database3.usingFallback,
    databaseReason: database3.reason,
    sessionTableExists: Boolean(bootstrap.bootstrapState?.sessionTableExists),
    offerTableExists: Boolean(bootstrap.bootstrapState?.offerTableExists),
    bootstrapDatabasePath: bootstrap.bootstrapState?.resolvedPath || "",
    sessionStorageReady,
    sessionStorageError,
    configFiles: readConfigFiles(),
    shops: sessions.map((current) => current.shop),
    diagnostics
  });
}, action2 = async ({ request }) => {
  let { admin, session } = await authenticate.admin(request), formData = await request.formData(), intent = String(formData.get("intent") || "");
  if (!intent)
    return (0, import_node6.json)(
      { ok: !1, message: "Missing action intent." },
      { status: 400 }
    );
  if (intent === "delete") {
    let id = String(formData.get("id") || "");
    return id ? (await db_server_default.offer.deleteMany({
      where: { id, shop: session.shop }
    }), (0, import_node6.json)({ ok: !0, message: "Offer deleted." })) : (0, import_node6.json)({ ok: !1, message: "Missing offer id." }, { status: 400 });
  }
  if (intent === "toggle") {
    let id = String(formData.get("id") || ""), isActive = String(formData.get("isActive") || "false") === "true";
    return await db_server_default.offer.updateMany({
      where: { id, shop: session.shop },
      data: { isActive }
    }), (0, import_node6.json)({
      ok: !0,
      message: isActive ? "Offer enabled." : "Offer disabled."
    });
  }
  if (intent !== "save")
    return (0, import_node6.json)({ ok: !1, message: "Unsupported action." }, { status: 400 });
  let catalog = await loadCatalog(admin), result = validateOfferInput(formData, catalog);
  if (result.errors)
    return (0, import_node6.json)(
      {
        ok: !1,
        message: "Please fix the highlighted fields.",
        errors: result.errors
      },
      { status: 400 }
    );
  let values = result.values;
  return await db_server_default.offer.upsert({
    where: { id: values.id },
    update: {
      ...values,
      shop: session.shop
    },
    create: {
      ...values,
      shop: session.shop
    }
  }), (0, import_node6.json)({ ok: !0, message: "Offer saved." });
}, DEFAULT_FORM_STATE = {
  id: "",
  name: "",
  isActive: !0,
  triggerType: "product",
  triggerTargetId: "",
  offerVariantId: "",
  headline: "",
  description: "",
  acceptLabel: "Add to order",
  declineLabel: "No thanks",
  priority: "100",
  discountType: "none",
  discountValue: ""
};
function createFormState(offer) {
  return offer ? {
    id: offer.id,
    name: offer.name,
    isActive: offer.isActive,
    triggerType: offer.triggerVariantId ? "variant" : "product",
    triggerTargetId: offer.triggerVariantId || offer.triggerProductId || "",
    offerVariantId: offer.offerVariantId,
    headline: offer.headline,
    description: offer.description,
    acceptLabel: offer.acceptLabel,
    declineLabel: offer.declineLabel || "No thanks",
    priority: String(offer.priority),
    discountType: offer.discountType || "none",
    discountValue: offer.discountValue == null ? "" : String(Number(offer.discountValue))
  } : DEFAULT_FORM_STATE;
}
function statusTone(isActive) {
  return isActive ? "success" : "attention";
}
function formatDate(dateString) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(dateString));
}
function OfferEditorModal({
  active,
  offer,
  onClose,
  saveFetcher,
  productOptions,
  variantOptions
}) {
  let [formState, setFormState] = (0, import_react4.useState)(DEFAULT_FORM_STATE);
  (0, import_react4.useEffect)(() => {
    active && setFormState(createFormState(offer));
  }, [active, offer]);
  let errors = saveFetcher.data?.errors || {}, isSaving = saveFetcher.state !== "idle", triggerOptions = formState.triggerType === "variant" ? variantOptions : productOptions, updateField = (field) => (value) => {
    setFormState((current) => ({ ...current, [field]: value }));
  };
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
    import_polaris.Modal,
    {
      open: active,
      onClose,
      title: offer ? "Edit upsell offer" : "Create upsell offer",
      primaryAction: {
        content: offer ? "Save changes" : "Create offer",
        onAction: () => {
          saveFetcher.submit(
            {
              intent: "save",
              ...formState,
              isActive: String(formState.isActive)
            },
            { method: "post" }
          );
        },
        loading: isSaving
      },
      secondaryActions: [{ content: "Cancel", onAction: onClose }],
      children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_polaris.Modal.Section, { children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.BlockStack, { gap: "400", children: [
        saveFetcher.data?.message && !saveFetcher.data?.ok ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_polaris.Banner, { tone: "critical", children: saveFetcher.data.message }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.FormLayout, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            import_polaris.TextField,
            {
              label: "Internal name",
              value: formState.name,
              onChange: updateField("name"),
              autoComplete: "off",
              error: errors.name,
              helpText: "Only visible inside your app."
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            import_polaris.Checkbox,
            {
              label: "Offer is active",
              checked: formState.isActive,
              onChange: (value) => updateField("isActive")(value)
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            import_polaris.Select,
            {
              label: "Trigger when buyer purchased",
              options: [
                { label: "A product", value: "product" },
                { label: "A specific variant", value: "variant" }
              ],
              value: formState.triggerType,
              onChange: (value) => setFormState((current) => ({
                ...current,
                triggerType: value,
                triggerTargetId: ""
              }))
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            import_polaris.Select,
            {
              label: formState.triggerType === "variant" ? "Trigger variant" : "Trigger product",
              options: [
                {
                  label: triggerOptions.length > 0 ? "Select an item" : "No products available",
                  value: ""
                },
                ...triggerOptions
              ],
              value: formState.triggerTargetId,
              onChange: updateField("triggerTargetId"),
              error: errors.triggerTargetId,
              disabled: triggerOptions.length === 0
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            import_polaris.Select,
            {
              label: "Offer this variant post-purchase",
              options: [
                {
                  label: variantOptions.length > 0 ? "Select an offer variant" : "No variants available",
                  value: ""
                },
                ...variantOptions
              ],
              value: formState.offerVariantId,
              onChange: updateField("offerVariantId"),
              error: errors.offerVariantId,
              disabled: variantOptions.length === 0
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            import_polaris.TextField,
            {
              label: "Upsell headline",
              value: formState.headline,
              onChange: updateField("headline"),
              autoComplete: "off",
              error: errors.headline
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            import_polaris.TextField,
            {
              label: "Offer description",
              value: formState.description,
              onChange: updateField("description"),
              multiline: 4,
              autoComplete: "off",
              error: errors.description,
              helpText: "Supports multiple lines. Each line becomes a bullet-style text block in the extension."
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.InlineStack, { gap: "400", align: "start", children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_polaris.Box, { minWidth: "240px", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
              import_polaris.TextField,
              {
                label: "Accept button text",
                value: formState.acceptLabel,
                onChange: updateField("acceptLabel"),
                autoComplete: "off",
                error: errors.acceptLabel
              }
            ) }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_polaris.Box, { minWidth: "240px", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
              import_polaris.TextField,
              {
                label: "Decline text",
                value: formState.declineLabel,
                onChange: updateField("declineLabel"),
                autoComplete: "off"
              }
            ) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.InlineStack, { gap: "400", align: "start", children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_polaris.Box, { minWidth: "200px", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
              import_polaris.TextField,
              {
                label: "Priority",
                type: "number",
                value: formState.priority,
                onChange: updateField("priority"),
                autoComplete: "off",
                helpText: "Lower numbers are shown first."
              }
            ) }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_polaris.Box, { minWidth: "240px", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
              import_polaris.Select,
              {
                label: "Discount",
                options: [
                  { label: "No discount", value: "none" },
                  { label: "Percentage off", value: "percentage" },
                  { label: "Fixed amount off", value: "fixed_amount" }
                ],
                value: formState.discountType,
                onChange: updateField("discountType")
              }
            ) }),
            formState.discountType !== "none" ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_polaris.Box, { minWidth: "160px", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
              import_polaris.TextField,
              {
                label: "Discount value",
                type: "number",
                value: formState.discountValue,
                onChange: updateField("discountValue"),
                autoComplete: "off",
                error: errors.discountValue
              }
            ) }) : null
          ] })
        ] })
      ] }) })
    }
  );
}
function Index() {
  let {
    shop,
    offers,
    productOptions,
    variantOptions,
    activeAppUrl,
    publicAppUrlSource,
    hostValue,
    publicAppUrlEnv,
    shopifyAppUrlEnv,
    extensionAppUrl,
    databaseMode,
    databaseUrl,
    resolvedDatabasePath,
    usingDatabaseFallback,
    databaseReason,
    sessionTableExists,
    offerTableExists,
    bootstrapDatabasePath,
    sessionStorageReady,
    sessionStorageError,
    configFiles,
    shops,
    diagnostics
  } = (0, import_react3.useLoaderData)(), saveFetcher = (0, import_react3.useFetcher)(), actionFetcher = (0, import_react3.useFetcher)(), diagnosticsFetcher = (0, import_react3.useFetcher)(), revalidator = (0, import_react3.useRevalidator)(), [editorOpen, setEditorOpen] = (0, import_react4.useState)(!1), [editingOfferId, setEditingOfferId] = (0, import_react4.useState)(null), [flashMessage, setFlashMessage] = (0, import_react4.useState)(null), editingOffer = (0, import_react4.useMemo)(
    () => offers.find((offer) => offer.id === editingOfferId) || null,
    [editingOfferId, offers]
  ), urlsMatch = Boolean(activeAppUrl) && Boolean(extensionAppUrl) && activeAppUrl === extensionAppUrl, activeDiagnostics = diagnosticsFetcher.data || diagnostics;
  (0, import_react4.useEffect)(() => {
    saveFetcher.state === "idle" && saveFetcher.data?.ok && (setFlashMessage(saveFetcher.data.message), setEditorOpen(!1), setEditingOfferId(null), revalidator.revalidate());
  }, [revalidator, saveFetcher.data, saveFetcher.state]), (0, import_react4.useEffect)(() => {
    actionFetcher.state === "idle" && actionFetcher.data?.ok && (setFlashMessage(actionFetcher.data.message), revalidator.revalidate());
  }, [actionFetcher.data, actionFetcher.state, revalidator]);
  let openCreate = () => {
    setEditingOfferId(null), setEditorOpen(!0);
  }, openEdit = (id) => {
    setEditingOfferId(id), setEditorOpen(!0);
  }, toggleOffer = (offer) => {
    actionFetcher.submit(
      {
        intent: "toggle",
        id: offer.id,
        isActive: String(!offer.isActive)
      },
      { method: "post" }
    );
  }, deleteOffer = (offer) => {
    actionFetcher.submit(
      { intent: "delete", id: offer.id },
      { method: "post" }
    );
  };
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
    import_polaris.Page,
    {
      title: "Manage post-purchase upsell offers",
      subtitle: "Create, prioritize, and publish the offers your buyers see immediately after checkout.",
      primaryAction: {
        content: "Create offer",
        onAction: openCreate,
        disabled: variantOptions.length === 0
      },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("ui-title-bar", { title: "Post-purchase upsells" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.BlockStack, { gap: "500", children: [
          flashMessage ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_polaris.Banner, { tone: "success", onDismiss: () => setFlashMessage(null), children: flashMessage }) : null,
          variantOptions.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.Banner, { tone: "warning", children: [
            "No products or variants are available yet for",
            " ",
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { children: shop }),
            ". Add products in Shopify first, then come back here to configure offers."
          ] }) : null,
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.Layout, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_polaris.Layout.Section, { children: offers.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_polaris.Card, { children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
              import_polaris.EmptyState,
              {
                heading: "Create your first post-purchase offer",
                action: {
                  content: "Create offer",
                  onAction: openCreate,
                  disabled: variantOptions.length === 0
                },
                image: "https://cdn.shopify.com/shopifycloud/web/assets/v1/6e34d29fbf2d1470.svg",
                children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { children: "Choose which purchased products should trigger an upsell, pick the offer variant, and customize the buyer-facing copy without editing metafields manually." })
              }
            ) }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_polaris.BlockStack, { gap: "400", children: offers.map((offer) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_polaris.Card, { children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.BlockStack, { gap: "300", children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.InlineStack, { align: "space-between", blockAlign: "start", children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.BlockStack, { gap: "100", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.InlineStack, { gap: "200", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_polaris.Text, { as: "h2", variant: "headingMd", children: offer.name }),
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_polaris.Badge, { tone: statusTone(offer.isActive), children: offer.isActive ? "Active" : "Inactive" })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.Text, { as: "p", variant: "bodyMd", tone: "subdued", children: [
                    "Trigger: ",
                    offer.triggerLabel || "Not set",
                    " | Offer:",
                    " ",
                    offer.offerLabel
                  ] })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.InlineStack, { gap: "200", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_polaris.Button, { onClick: () => toggleOffer(offer), children: offer.isActive ? "Disable" : "Enable" }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_polaris.Button, { onClick: () => openEdit(offer.id), children: "Edit" }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                    import_polaris.Button,
                    {
                      destructive: !0,
                      onClick: () => deleteOffer(offer),
                      children: "Delete"
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_polaris.Text, { as: "p", variant: "bodyMd", children: offer.headline }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_polaris.Text, { as: "p", variant: "bodyMd", tone: "subdued", children: offer.description }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.InlineStack, { gap: "400", wrap: !0, children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.Badge, { children: [
                  "Priority ",
                  offer.priority
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.Badge, { tone: "info", children: [
                  "Accept CTA: ",
                  offer.acceptLabel
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.Badge, { tone: "info", children: [
                  "Decline: ",
                  offer.declineLabel || "Default"
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.Badge, { tone: "attention", children: [
                  "Discount:",
                  " ",
                  offer.discountType ? `${offer.discountValue} ${offer.discountType === "fixed_amount" ? "fixed amount" : "%"}` : "None"
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.Text, { as: "span", variant: "bodySm", tone: "subdued", children: [
                  "Updated ",
                  formatDate(offer.updatedAt)
                ] })
              ] })
            ] }) }, offer.id)) }) }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_polaris.Layout.Section, { variant: "oneThird", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.BlockStack, { gap: "400", children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_polaris.Card, { children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.BlockStack, { gap: "200", children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_polaris.Text, { as: "h2", variant: "headingMd", children: "System status" }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.List, { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.List.Item, { children: [
                    "Public URL sync: ",
                    urlsMatch ? "Healthy" : "Mismatch"
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.List.Item, { children: [
                    "Session storage:",
                    " ",
                    sessionStorageReady ? "Ready" : sessionStorageError
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.List.Item, { children: [
                    "Database mode: ",
                    databaseMode
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.List.Item, { children: [
                    "Offer table: ",
                    offerTableExists ? "Ready" : "Missing"
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.List.Item, { children: [
                    "Session table: ",
                    sessionTableExists ? "Ready" : "Missing"
                  ] })
                ] })
              ] }) }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_polaris.Card, { children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.BlockStack, { gap: "200", children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_polaris.Text, { as: "h2", variant: "headingMd", children: "Advanced diagnostics" }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.List, { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.List.Item, { children: [
                    "Active public app URL: ",
                    activeAppUrl || "Not set"
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.List.Item, { children: [
                    "Resolved URL source: ",
                    publicAppUrlSource || "Not set"
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.List.Item, { children: [
                    "`PUBLIC_APP_URL`: ",
                    publicAppUrlEnv || "Not set"
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.List.Item, { children: [
                    "`SHOPIFY_APP_URL`: ",
                    shopifyAppUrlEnv || "Not set"
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.List.Item, { children: [
                    "`HOST`: ",
                    hostValue || "Not set"
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.List.Item, { children: [
                    "Synced extension APP_URL: ",
                    extensionAppUrl
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.List.Item, { children: [
                    "App/extension URL match: ",
                    urlsMatch ? "Yes" : "No"
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.List.Item, { children: [
                    "Effective DB URL: ",
                    databaseUrl
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.List.Item, { children: [
                    "Runtime DB path: ",
                    resolvedDatabasePath || "n/a"
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.List.Item, { children: [
                    "Bootstrap DB path: ",
                    bootstrapDatabasePath || "n/a"
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.List.Item, { children: [
                    "DB fallback: ",
                    usingDatabaseFallback ? "Yes" : "No",
                    " (",
                    databaseReason,
                    ")"
                  ] })
                ] })
              ] }) }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_polaris.Card, { children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.BlockStack, { gap: "200", children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.InlineStack, { align: "space-between", blockAlign: "center", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_polaris.Text, { as: "h2", variant: "headingMd", children: "Post-purchase runtime diagnostics" }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                    import_polaris.Button,
                    {
                      onClick: () => diagnosticsFetcher.load("/api/post-purchase-debug"),
                      loading: diagnosticsFetcher.state !== "idle",
                      children: "Refresh"
                    }
                  )
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.List, { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.List.Item, { children: [
                    "Resolved public app URL:",
                    " ",
                    activeDiagnostics.publicUrl?.resolvedAppUrl || "Not set"
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.List.Item, { children: [
                    "URL source:",
                    " ",
                    activeDiagnostics.publicUrl?.source || "Unknown"
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.List.Item, { children: [
                    "Resolved extension APP_URL:",
                    " ",
                    activeDiagnostics.publicUrl?.extensionAppUrl || "Missing"
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.List.Item, { children: [
                    "App/extension URL match:",
                    " ",
                    activeDiagnostics.publicUrl?.extensionMatchesAppUrl ? "Yes" : "No"
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.List.Item, { children: [
                    "Last synced URL timestamp:",
                    " ",
                    activeDiagnostics.publicUrl?.lastSyncedAt || "Unknown"
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.List.Item, { children: [
                    "Last sync source:",
                    " ",
                    activeDiagnostics.publicUrl?.syncSource || "Unknown"
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.List.Item, { children: [
                    "Placeholder URL detected in active paths:",
                    " ",
                    activeDiagnostics.publicUrl?.placeholderScan?.hasForbiddenTokens ? "Yes" : "No"
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.List.Item, { children: [
                    "Extension module in dev preview:",
                    " ",
                    activeDiagnostics.extension?.modulePresent ? "Yes" : "No"
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.List.Item, { children: [
                    "Extension handle:",
                    " ",
                    activeDiagnostics.extension?.module?.handle || "Missing"
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.List.Item, { children: [
                    "Extension type:",
                    " ",
                    activeDiagnostics.extension?.module?.type || "Missing"
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.List.Item, { children: [
                    "Extension target:",
                    " ",
                    activeDiagnostics.extension?.module?.target || "(empty)"
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.List.Item, { children: [
                    "App selected for post-purchase:",
                    " ",
                    activeDiagnostics.selection?.isPostPurchaseAppInUse == null ? "Unknown" : activeDiagnostics.selection.isPostPurchaseAppInUse ? "Yes" : "No"
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.List.Item, { children: [
                    "Build contains current public URL:",
                    " ",
                    activeDiagnostics.build?.bundleContainsExpectedUrl ? "Yes" : "No"
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.List.Item, { children: [
                    "Build contains `ShouldRender` log:",
                    " ",
                    activeDiagnostics.build?.bundleContainsShouldRenderLog ? "Yes" : "No"
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.List.Item, { children: [
                    "Build contains `Render` log:",
                    " ",
                    activeDiagnostics.build?.bundleContainsRenderLog ? "Yes" : "No"
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.List.Item, { children: [
                    "Recent `/api/offer` hit:",
                    " ",
                    activeDiagnostics.recentRequests?.apiOffer?.seenAt || "Not seen"
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.List.Item, { children: [
                    "Recent `/api/sign-changeset` hit:",
                    " ",
                    activeDiagnostics.recentRequests?.apiSignChangeset?.seenAt || "Not seen"
                  ] })
                ] }),
                activeDiagnostics.publicUrl?.candidates?.length ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_polaris.Banner, { tone: "info", children: activeDiagnostics.publicUrl.candidates.map((candidate) => candidate.normalized ? `${candidate.key} -> ${candidate.normalized}` : `${candidate.key} rejected (${candidate.reason || "invalid"})`).join(" | ") }) : null,
                activeDiagnostics.publicUrl?.placeholderScan?.hasForbiddenTokens ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.Banner, { tone: "critical", children: [
                  "Forbidden placeholder URL tokens were found in:",
                  " ",
                  activeDiagnostics.publicUrl.placeholderScan.matches.map(
                    (match) => `${match.file} (${match.tokens.join(", ")})`
                  ).join(" | ")
                ] }) : null,
                activeDiagnostics.selection?.errors ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.Banner, { tone: "warning", children: [
                  "Could not confirm post-purchase selection state:",
                  " ",
                  activeDiagnostics.selection.errors.join(", ")
                ] }) : null
              ] }) }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_polaris.Card, { children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.BlockStack, { gap: "200", children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_polaris.Text, { as: "h2", variant: "headingMd", children: "Installed shops" }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_polaris.List, { children: shops.map((currentShop) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_polaris.List.Item, { children: currentShop }, currentShop)) })
              ] }) }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_polaris.Card, { children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.BlockStack, { gap: "200", children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_polaris.Text, { as: "h2", variant: "headingMd", children: "Post-purchase test checklist" }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_polaris.Banner, { tone: urlsMatch ? "info" : "warning", children: "Local post-purchase tests must use the checkout link from Shopify CLI Dev Console or an active checkout browser preview, and the app plus extension must agree on one real public URL. Orders also need to come from Online Store checkout with a shipping address and a supported card payment." }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.List, { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_polaris.List.Item, { children: "Run `shopify app dev` and use the post-purchase checkout link from the Dev Console." }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_polaris.List.Item, { children: "Confirm \u201CApp selected for post-purchase\u201D is `Yes` in the diagnostics panel above." }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_polaris.List.Item, { children: "Leave `PUBLIC_APP_URL` unset for normal Shopify CLI tunnel dev. Set it only when you intentionally want a permanent hostname." }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_polaris.List.Item, { children: "If you use a permanent hostname, set `PUBLIC_APP_URL=https://offers.mydomain.com`, run `npm run sync:app-url`, then restart `shopify app dev`." }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_polaris.List.Item, { children: "Refresh the diagnostics panel and confirm the resolved app URL, extension APP_URL, and last synced URL timestamp all match." }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_polaris.List.Item, { children: "Use Online Store checkout with a shipping address and a supported card payment method." }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_polaris.List.Item, { children: "The payment must still be eligible for post-purchase. Shopify requires a vaulted credit card and skips the extension for wallets, gift-card payments, and other unsupported methods." }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_polaris.List.Item, { children: "Complete the order, refresh diagnostics, and confirm this server saw `/api/offer`." }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_polaris.List.Item, { children: "If `/api/offer` is still \u201CNot seen\u201D, Shopify skipped the extension before our app was invoked." }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_polaris.List.Item, { children: "`npm run dev:clean` clears the current dev preview." }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_polaris.List.Item, { children: "`npm run dev:reset` reselects the app and store." }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_polaris.List.Item, { children: [
                    "Config files:",
                    " ",
                    configFiles.map((config) => config.file).join(", ")
                  ] })
                ] })
              ] }) })
            ] }) })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          OfferEditorModal,
          {
            active: editorOpen,
            offer: editingOffer,
            onClose: () => {
              setEditorOpen(!1), setEditingOfferId(null);
            },
            saveFetcher,
            productOptions,
            variantOptions
          }
        )
      ]
    }
  );
}

// app/routes/auth.login/route.jsx
var route_exports = {};
__export(route_exports, {
  action: () => action3,
  default: () => Auth,
  links: () => links,
  loader: () => loader5
});
var import_react5 = require("react"), import_node7 = require("@remix-run/node"), import_polaris2 = require("@shopify/polaris"), import_react6 = require("@remix-run/react");

// node_modules/@shopify/polaris/build/esm/styles.css
var styles_default = "/build/_assets/styles-62I325MT.css";

// app/routes/auth.login/error.server.jsx
var import_server2 = require("@shopify/shopify-app-remix/server");
function loginErrorMessage(loginErrors) {
  return loginErrors?.shop === import_server2.LoginErrorType.MissingShop ? { shop: "Please enter your shop domain to log in" } : loginErrors?.shop === import_server2.LoginErrorType.InvalidShop ? { shop: "Please enter a valid shop domain to log in" } : {};
}

// app/routes/auth.login/route.jsx
var import_jsx_runtime4 = require("react/jsx-runtime"), links = () => [{ rel: "stylesheet", href: styles_default }], loader5 = async ({ request }) => {
  let errors = loginErrorMessage(await login(request));
  return (0, import_node7.json)({
    errors,
    polarisTranslations: require("@shopify/polaris/locales/en.json")
  });
}, action3 = async ({ request }) => {
  let errors = loginErrorMessage(await login(request));
  return (0, import_node7.json)({
    errors
  });
};
function Auth() {
  let loaderData = (0, import_react6.useLoaderData)(), actionData = (0, import_react6.useActionData)(), [shop, setShop] = (0, import_react5.useState)(""), { errors } = actionData || loaderData;
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_polaris2.AppProvider, { i18n: loaderData.polarisTranslations, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_polaris2.Page, { children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_polaris2.Card, { children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_react6.Form, { method: "post", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_polaris2.FormLayout, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_polaris2.Text, { variant: "headingMd", as: "h2", children: "Log in" }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
      import_polaris2.TextField,
      {
        type: "text",
        name: "shop",
        label: "Shop domain",
        helpText: "example.myshopify.com",
        value: shop,
        onChange: setShop,
        autoComplete: "on",
        error: errors.shop
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_polaris2.Button, { submit: !0, children: "Log in" })
  ] }) }) }) }) });
}

// app/routes/api.offer.jsx
var api_offer_exports = {};
__export(api_offer_exports, {
  action: () => action4,
  loader: () => loader6
});
var import_node8 = require("@remix-run/node");
var LOG_PREFIX3 = "[post-purchase]", loader6 = async ({ request }) => {
  let { cors } = await authenticate.public.checkout(request);
  return cors(new Response());
}, action4 = async ({ request }) => {
  let { cors, sessionToken } = await authenticate.public.checkout(request), body = await request.json().catch(() => ({})), shop = getShopDomainFromSessionToken(sessionToken), lineItems = getInitialLineItemsFromSessionToken(sessionToken), referenceId = body?.referenceId || null;
  if (console.log(
    `${LOG_PREFIX3} api.offer.request ${JSON.stringify({
      referenceId,
      shop,
      lineItems
    })}`
  ), markPostPurchaseRuntimeHit("apiOffer", {
    referenceId,
    shop,
    lineItems
  }), !shop || lineItems.length === 0)
    return console.log(
      `${LOG_PREFIX3} api.offer.skip ${JSON.stringify({
        referenceId,
        shop,
        reason: "missing-checkout-context",
        lineItems
      })}`
    ), cors(
      (0, import_node8.json)(
        {
          offers: [],
          debug: {
            referenceId,
            shopDomain: shop,
            lineItems,
            reason: "missing-checkout-context"
          },
          error: "Missing checkout context"
        },
        { status: 400 }
      )
    );
  let accessToken = (await db_server_default.session.findUnique({
    where: { shop },
    select: { accessToken: !0 }
  }))?.accessToken;
  if (!accessToken)
    return console.log(
      `${LOG_PREFIX3} api.offer.error ${JSON.stringify({
        referenceId,
        shop,
        reason: "missing-offline-session"
      })}`
    ), cors(
      (0, import_node8.json)(
        {
          offers: [],
          debug: {
            referenceId,
            shopDomain: shop,
            lineItems,
            reason: "missing-offline-session"
          },
          error: `No offline session found for ${shop}`
        },
        { status: 404 }
      )
    );
  let result = await resolveActiveOffersForCheckout({
    accessToken,
    shopDomain: shop,
    lineItems,
    referenceId
  });
  return console.log(
    `${LOG_PREFIX3} api.offer.result ${JSON.stringify({
      referenceId,
      shop,
      matchedOfferIds: result.debug.matchedOfferIds,
      reason: result.debug.reason,
      offerMatches: result.debug.offerMatches,
      renderedOfferCount: result.offers.length
    })}`
  ), cors((0, import_node8.json)(result));
};

// app/routes/webhooks.jsx
var webhooks_exports = {};
__export(webhooks_exports, {
  action: () => action5
});
var action5 = async ({ request }) => {
  let { topic, shop, session, admin, payload } = await authenticate.webhook(
    request
  );
  if (!admin)
    throw new Response();
  switch (topic) {
    case "APP_UNINSTALLED":
    case "CUSTOMERS_DATA_REQUEST":
    case "CUSTOMERS_REDACT":
    case "SHOP_REDACT":
    default:
      throw new Response("Unhandled webhook topic", { status: 404 });
  }
  throw new Response();
};

// app/routes/healthz.jsx
var healthz_exports = {};
__export(healthz_exports, {
  loader: () => loader7
});
var import_node9 = require("@remix-run/node");
var loader7 = async () => {
  let database3 = getResolvedDatabaseLocation(), bootstrap = assertLocalDatabaseState(), publicAppUrlResolution = resolvePublicAppUrl(), sessionStorageReady = !1, sessionStorageError = null;
  try {
    await db_server_default.session.count(), sessionStorageReady = !0;
  } catch (error) {
    sessionStorageError = error instanceof Error ? error.message : "Unknown Prisma error";
  }
  return (0, import_node9.json)(
    {
      publicAppUrl: getPublicAppUrl() || null,
      publicAppUrlSource: publicAppUrlResolution.source || null,
      publicAppUrlCandidates: publicAppUrlResolution.candidates,
      publicAppUrlEnv: process.env.PUBLIC_APP_URL || null,
      shopifyAppUrlEnv: process.env.SHOPIFY_APP_URL || null,
      hostEnv: process.env.HOST || null,
      extensionAppUrl: (await Promise.resolve().then(() => (init_app_url(), app_url_exports))).APP_URL,
      publicUrlSyncState: getPublicAppUrlSyncState(),
      databaseMode: database3.mode,
      resolvedDatabaseUrl: redactDatabaseUrl(database3.url),
      resolvedDatabasePath: database3.resolvedPath,
      usingDatabaseFallback: database3.usingFallback,
      sessionTableExists: Boolean(bootstrap.bootstrapState?.sessionTableExists),
      offerTableExists: Boolean(bootstrap.bootstrapState?.offerTableExists),
      sessionStorageReady,
      sessionStorageError
    },
    { status: sessionStorageReady ? 200 : 503 }
  );
};

// app/routes/_index/route.jsx
var route_exports2 = {};
__export(route_exports2, {
  default: () => App2,
  links: () => links2,
  loader: () => loader8
});
var import_node10 = require("@remix-run/node"), import_react7 = require("@remix-run/react");

// app/routes/_index/style.css
var style_default = "/build/_assets/style-6S2Q7E3W.css";

// app/routes/_index/route.jsx
var import_jsx_runtime5 = require("react/jsx-runtime"), links2 = () => [{ rel: "stylesheet", href: style_default }], loader8 = async ({ request }) => {
  let url = new URL(request.url);
  if (url.searchParams.get("shop"))
    throw (0, import_node10.redirect)(`/app?${url.searchParams.toString()}`);
  return (0, import_node10.json)({ showForm: Boolean(login) });
};
function App2() {
  let { showForm } = (0, import_react7.useLoaderData)();
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "index", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "content", children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h1", { children: "A short heading about [your app]" }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { children: "A tagline about [your app] that describes your value proposition." }),
    showForm && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_react7.Form, { method: "post", action: "/auth/login", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: "Shop domain" }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("input", { type: "text", name: "shop" }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: "e.g: my-shop-domain.myshopify.com" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "submit", children: "Log in" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("ul", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("li", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("strong", { children: "Product feature" }),
        ". Some detail about your feature and its benefit to your customer."
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("li", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("strong", { children: "Product feature" }),
        ". Some detail about your feature and its benefit to your customer."
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("li", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("strong", { children: "Product feature" }),
        ". Some detail about your feature and its benefit to your customer."
      ] })
    ] })
  ] }) });
}

// app/routes/auth.$.jsx
var auth_exports = {};
__export(auth_exports, {
  loader: () => loader9
});
var loader9 = async ({ request }) => (await authenticate.admin(request), null);

// app/routes/socket.jsx
var socket_exports = {};
__export(socket_exports, {
  action: () => action6,
  default: () => SocketRoute,
  loader: () => loader10
});
var socketProbeResponse = () => new Response(null, {
  status: 204,
  headers: {
    "Cache-Control": "no-store",
    "X-Shopify-Dev-Proxy": "socket-probe-ack"
  }
}), loader10 = async () => socketProbeResponse(), action6 = async () => socketProbeResponse();
function SocketRoute() {
  return null;
}

// app/routes/ping.jsx
var ping_exports = {};
__export(ping_exports, {
  action: () => action7,
  loader: () => loader11
});
var loader11 = async () => new Response("ok", { status: 200 }), action7 = async () => new Response("ok", { status: 200 });

// app/routes/app.jsx
var app_exports = {};
__export(app_exports, {
  ErrorBoundary: () => ErrorBoundary,
  default: () => App3,
  headers: () => headers,
  links: () => links3,
  loader: () => loader12
});
var import_node11 = require("@remix-run/node"), import_react8 = require("@remix-run/react");
var import_server3 = require("@shopify/shopify-app-remix/server"), import_react9 = require("@shopify/shopify-app-remix/react");
var import_jsx_runtime6 = require("react/jsx-runtime"), links3 = () => [{ rel: "stylesheet", href: styles_default }], loader12 = async ({ request }) => (await authenticate.admin(request), (0, import_node11.json)({ apiKey: process.env.SHOPIFY_API_KEY || "" }));
function App3() {
  let { apiKey } = (0, import_react8.useLoaderData)();
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_react9.AppProvider, { isEmbeddedApp: !0, apiKey, children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("ui-nav-menu", { children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_react8.Link, { to: "/app", rel: "home", children: "Post-purchase upsells" }) }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_react8.Outlet, {})
  ] });
}
function ErrorBoundary() {
  return import_server3.boundary.error((0, import_react8.useRouteError)());
}
var headers = (headersArgs) => import_server3.boundary.headers(headersArgs);

// server-assets-manifest:@remix-run/dev/assets-manifest
var assets_manifest_default = { entry: { module: "/build/entry.client-PO62TSQO.js", imports: ["/build/_shared/chunk-SBT2SOQF.js", "/build/_shared/chunk-Q3IECNXJ.js"] }, routes: { root: { id: "root", parentId: void 0, path: "", index: void 0, caseSensitive: void 0, module: "/build/root-T3PQXBRM.js", imports: void 0, hasAction: !1, hasLoader: !1, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/_index": { id: "routes/_index", parentId: "root", path: void 0, index: !0, caseSensitive: void 0, module: "/build/routes/_index-24NCTB3Y.js", imports: ["/build/_shared/chunk-WK3XIJ7S.js", "/build/_shared/chunk-PGOH7JLP.js"], hasAction: !1, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/api.offer": { id: "routes/api.offer", parentId: "root", path: "api/offer", index: void 0, caseSensitive: void 0, module: "/build/routes/api.offer-D3AWU6HY.js", imports: void 0, hasAction: !0, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/api.post-purchase-debug": { id: "routes/api.post-purchase-debug", parentId: "root", path: "api/post-purchase-debug", index: void 0, caseSensitive: void 0, module: "/build/routes/api.post-purchase-debug-QB2XVK4M.js", imports: void 0, hasAction: !1, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/api.sign-changeset": { id: "routes/api.sign-changeset", parentId: "root", path: "api/sign-changeset", index: void 0, caseSensitive: void 0, module: "/build/routes/api.sign-changeset-KSQAMMYS.js", imports: void 0, hasAction: !0, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/app": { id: "routes/app", parentId: "root", path: "app", index: void 0, caseSensitive: void 0, module: "/build/routes/app-HKLC7464.js", imports: ["/build/_shared/chunk-WF3ETG76.js", "/build/_shared/chunk-AGMJS5AF.js", "/build/_shared/chunk-D2A43AEV.js", "/build/_shared/chunk-PGOH7JLP.js"], hasAction: !1, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !0 }, "routes/app._index": { id: "routes/app._index", parentId: "routes/app", path: void 0, index: !0, caseSensitive: void 0, module: "/build/routes/app._index-6LKLOROY.js", imports: void 0, hasAction: !0, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/app.additional": { id: "routes/app.additional", parentId: "routes/app", path: "additional", index: void 0, caseSensitive: void 0, module: "/build/routes/app.additional-Q6AV75U3.js", imports: void 0, hasAction: !1, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/auth.$": { id: "routes/auth.$", parentId: "root", path: "auth/*", index: void 0, caseSensitive: void 0, module: "/build/routes/auth.$-JID2MVQG.js", imports: void 0, hasAction: !1, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/auth.login": { id: "routes/auth.login", parentId: "root", path: "auth/login", index: void 0, caseSensitive: void 0, module: "/build/routes/auth.login-KKG4P4LK.js", imports: ["/build/_shared/chunk-WK3XIJ7S.js", "/build/_shared/chunk-AGMJS5AF.js", "/build/_shared/chunk-D2A43AEV.js", "/build/_shared/chunk-PGOH7JLP.js"], hasAction: !0, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/healthz": { id: "routes/healthz", parentId: "root", path: "healthz", index: void 0, caseSensitive: void 0, module: "/build/routes/healthz-JAUOTYKT.js", imports: void 0, hasAction: !1, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/ping": { id: "routes/ping", parentId: "root", path: "ping", index: void 0, caseSensitive: void 0, module: "/build/routes/ping-KHKDYCP4.js", imports: void 0, hasAction: !0, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/socket": { id: "routes/socket", parentId: "root", path: "socket", index: void 0, caseSensitive: void 0, module: "/build/routes/socket-MMD3BLNW.js", imports: void 0, hasAction: !0, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/webhooks": { id: "routes/webhooks", parentId: "root", path: "webhooks", index: void 0, caseSensitive: void 0, module: "/build/routes/webhooks-U3VAOICH.js", imports: void 0, hasAction: !0, hasLoader: !1, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 } }, version: "f9b7d412", hmr: void 0, url: "/build/manifest-F9B7D412.js" };

// server-entry-module:@remix-run/dev/server-build
var mode = "production", assetsBuildDirectory = "public/build", future = { v3_fetcherPersist: !1, v3_relativeSplatPath: !1, v3_throwAbortReason: !1, v3_routeConfig: !1, v3_singleFetch: !1, v3_lazyRouteDiscovery: !1, unstable_optimizeDeps: !1 }, publicPath = "/build/", entry = { module: entry_server_exports }, routes = {
  root: {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: root_exports
  },
  "routes/api.post-purchase-debug": {
    id: "routes/api.post-purchase-debug",
    parentId: "root",
    path: "api/post-purchase-debug",
    index: void 0,
    caseSensitive: void 0,
    module: api_post_purchase_debug_exports
  },
  "routes/api.sign-changeset": {
    id: "routes/api.sign-changeset",
    parentId: "root",
    path: "api/sign-changeset",
    index: void 0,
    caseSensitive: void 0,
    module: api_sign_changeset_exports
  },
  "routes/app.additional": {
    id: "routes/app.additional",
    parentId: "routes/app",
    path: "additional",
    index: void 0,
    caseSensitive: void 0,
    module: app_additional_exports
  },
  "routes/app._index": {
    id: "routes/app._index",
    parentId: "routes/app",
    path: void 0,
    index: !0,
    caseSensitive: void 0,
    module: app_index_exports
  },
  "routes/auth.login": {
    id: "routes/auth.login",
    parentId: "root",
    path: "auth/login",
    index: void 0,
    caseSensitive: void 0,
    module: route_exports
  },
  "routes/api.offer": {
    id: "routes/api.offer",
    parentId: "root",
    path: "api/offer",
    index: void 0,
    caseSensitive: void 0,
    module: api_offer_exports
  },
  "routes/webhooks": {
    id: "routes/webhooks",
    parentId: "root",
    path: "webhooks",
    index: void 0,
    caseSensitive: void 0,
    module: webhooks_exports
  },
  "routes/healthz": {
    id: "routes/healthz",
    parentId: "root",
    path: "healthz",
    index: void 0,
    caseSensitive: void 0,
    module: healthz_exports
  },
  "routes/_index": {
    id: "routes/_index",
    parentId: "root",
    path: void 0,
    index: !0,
    caseSensitive: void 0,
    module: route_exports2
  },
  "routes/auth.$": {
    id: "routes/auth.$",
    parentId: "root",
    path: "auth/*",
    index: void 0,
    caseSensitive: void 0,
    module: auth_exports
  },
  "routes/socket": {
    id: "routes/socket",
    parentId: "root",
    path: "socket",
    index: void 0,
    caseSensitive: void 0,
    module: socket_exports
  },
  "routes/ping": {
    id: "routes/ping",
    parentId: "root",
    path: "ping",
    index: void 0,
    caseSensitive: void 0,
    module: ping_exports
  },
  "routes/app": {
    id: "routes/app",
    parentId: "root",
    path: "app",
    index: void 0,
    caseSensitive: void 0,
    module: app_exports
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  assets,
  assetsBuildDirectory,
  entry,
  future,
  mode,
  publicPath,
  routes
});
