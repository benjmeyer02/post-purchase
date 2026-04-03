# Post-purchase

Shopify embedded app and post-purchase extension deployed on Cloudflare Workers.

## Stack

- Shopify app runtime: `@shopify/shopify-app-react-router`
- Web app framework: React Router + Vite
- Cloudflare runtime: Workers + D1
- Data layer: Prisma D1 adapter
- Post-purchase UI: Shopify post-purchase extension

## Local development

1. Install dependencies:

```bash
npm install
```

2. Generate the Prisma client:

```bash
npm run db:generate
```

3. Start Shopify development:

```bash
npm run dev:shopify
```

The app URL resolves in this order:

1. `PUBLIC_APP_URL`
2. committed `application_url` in `shopify.app.toml`
3. Shopify CLI runtime URL during development

The post-purchase extension app URL is synced from the same source during `prebuild`.

## Cloudflare deployment

Required Cloudflare resources:

- Worker: `post-purchase`
- D1 database: `post-purchase-db`
- D1 database id: `9534ae0d-0372-459c-9d81-b5d15efa28d6`

Required Cloudflare secrets:

- `SHOPIFY_API_KEY`
- `SHOPIFY_APP_SECRET`

Required Cloudflare vars:

- `SHOPIFY_APP_URL=https://post-purchase.benjmeyer02.workers.dev`
- `PUBLIC_APP_URL=https://post-purchase.benjmeyer02.workers.dev`
- `SCOPES=read_products,write_products`

Build and deploy commands:

```bash
npm run build
npx wrangler deploy
```

Apply the D1 schema:

```bash
npm run db:apply:remote
```

## Verification

Useful commands:

```bash
npm run typecheck
npm run build
npm run cf-typegen
```

Routes to verify after deploy:

- `/healthz`
- `/api/post-purchase-debug`
- `/app`
