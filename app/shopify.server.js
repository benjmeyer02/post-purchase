import "@shopify/shopify-app-remix/adapters/node";
import {
  AppDistribution,
  DeliveryMethod,
  shopifyApp,
  LATEST_API_VERSION,
} from "@shopify/shopify-app-remix";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import db from "./db.server";
import {
  getRequiredPublicAppUrl,
  resolvePublicAppUrl,
  getResolvedDatabaseLocation,
  getScopes,
} from "./config.server";

const publicAppUrl = resolvePublicAppUrl();
const appUrl = getRequiredPublicAppUrl("Shopify app initialization");
const database = getResolvedDatabaseLocation();
const prismaSessionStorage = new PrismaSessionStorage(db);
const apiSecretKey =
  process.env.SHOPIFY_API_SECRET || process.env.SHOPIFY_APP_SECRET || "";

prismaSessionStorage.ready
  .then(() => {
    console.log("session storage ready: true");
  })
  .catch((error) => {
    console.error("session storage ready: false");
    console.error(error);
  });

console.log(`session storage db: ${database.resolvedPath || database.url}`);
console.log(`public app url: ${appUrl} (${publicAppUrl.source || "unknown"})`);

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY || "",
  apiSecretKey,
  apiVersion: LATEST_API_VERSION,
  scopes: getScopes(),
  appUrl,
  authPathPrefix: "/auth",
  sessionStorage: prismaSessionStorage,
  distribution: AppDistribution.AppStore,
  webhooks: {
    APP_UNINSTALLED: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks",
    },
    CUSTOMERS_DATA_REQUEST: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks",
    },
    CUSTOMERS_REDACT: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks",
    },
    SHOP_REDACT: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks",
    },
  },
  hooks: {
    afterAuth: async ({ session }) => {
      shopify.registerWebhooks({ session });
    },
  },
  future: {
    v3_webhookAdminContext: true,
    v3_authenticatePublic: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = LATEST_API_VERSION;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
