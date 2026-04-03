# Cloudflare deployment model

This repository contains two different concerns:

1. The Shopify app itself
2. A minimal Cloudflare Worker that can proxy a stable public URL to the app

## Why the Worker deploy failed

The Shopify app in this repo is not a standalone Cloudflare Worker today:

- `app/shopify.server.js` uses `@shopify/shopify-app-remix/adapters/node`
- `package.json` starts the app with `remix-serve build/index.js`
- `shopify.web.toml` runs a Node web process via `npm run dev:web`
- the default template database is SQLite, which Shopify documents as file-based and requiring filesystem access

Cloudflare Workers deploys require a real Worker entrypoint. The old `wrangler.toml`
incorrectly pointed at `src/index.js`, which does not exist in this repo.

## Correct architecture

Use this repo in split mode:

- Host the Shopify app on a Node-capable platform such as Cloud Run, Render, Fly.io, or another container host
- Use Cloudflare only as the stable public URL layer
- Deploy the Worker in this repo, which proxies requests from the Cloudflare URL to the real app origin

This keeps the public Shopify-facing URL stable while avoiding a partial and risky migration of the app runtime to Workers.

## Cloudflare Worker

The Worker entrypoint is `cloudflare/proxy.mjs`.

It expects one runtime variable in Cloudflare:

- `APP_ORIGIN`
  - Example: `https://your-real-app-host.example.com`
  - This must be the actual deployed origin of the Shopify Remix app
  - Do not set this to the Cloudflare `workers.dev` URL, or the proxy will loop

The Worker forwards requests to `APP_ORIGIN` and rewrites same-origin redirect
locations back to the incoming Cloudflare URL.

## Shopify app environment

The Shopify app should continue to use the public Cloudflare URL as its external URL:

- `PUBLIC_APP_URL=https://post-purchase.benjmeyer02.workers.dev`
- `SHOPIFY_APP_URL=https://post-purchase.benjmeyer02.workers.dev`

The committed `shopify.app.toml` should match that same public URL.

## Recommended Cloudflare Git settings

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Root directory: repository root
- Framework preset: `None`

## Important limitation

This Cloudflare deploy only publishes the proxy Worker. It does not host the Shopify
app process itself.

If you want the app to run directly on Cloudflare Workers in the future, that is a
real platform migration. It would require at least:

- replacing the Node adapter with a Worker-compatible adapter
- changing the Remix server target/runtime
- moving away from the current SQLite default
- verifying Prisma/database compatibility for Workers
