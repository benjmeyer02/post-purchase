import { createRequestHandler } from "react-router";

declare global {
  interface CloudflareEnvironment extends Env {}
}

export interface Env {
  post_purchase_db: D1Database;
  SHOPIFY_API_KEY: string;
  SHOPIFY_API_SECRET: string;
  SHOPIFY_APP_URL: string;
  PUBLIC_APP_URL: string;
  SCOPES: string;
}

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE
);

export default {
  async fetch(request, env, ctx) {
    return requestHandler(request, {
      cloudflare: { env, ctx },
    });
  },
} satisfies ExportedHandler<CloudflareEnvironment>;
