# Render deployment

This app's actual runtime should be hosted as a normal Node web service.
Cloudflare stays in front as the stable public URL and proxies to the Render
origin.

## Why Render fits this repo

- The app uses `@shopify/shopify-app-remix/adapters/node`
- Production startup is `remix-serve build/index.js`
- The repository already includes a `Dockerfile`
- Render supports Docker-based web services and persistent disks

Official docs:

- [Render Blueprint YAML reference](https://render.com/docs/blueprint-spec)
- [Docker on Render](https://render.com/docs/docker)

## Files added

- `render.yaml` creates a Docker web service named `post-purchase-app`
- The service mounts a persistent disk at `/var/data`
- SQLite is configured to live at `file:/var/data/dev.sqlite`

## Create the Render service

1. In Render, create a new Blueprint service from this repository.
2. Confirm the service uses branch `master`.
3. Let Render create the `post-purchase-app` web service.

## Required Render environment variables

Set these in Render after the service is created:

- `SHOPIFY_API_KEY`
- `SHOPIFY_API_SECRET`

You may also set:

- `SHOPIFY_APP_SECRET`

The app now accepts either `SHOPIFY_API_SECRET` or `SHOPIFY_APP_SECRET`, but
`SHOPIFY_API_SECRET` is the preferred production name.

These values should match your Shopify app credentials.

## Public URL settings

Leave these pointed at the Cloudflare Worker URL:

- `PUBLIC_APP_URL=https://post-purchase.benjmeyer02.workers.dev`
- `SHOPIFY_APP_URL=https://post-purchase.benjmeyer02.workers.dev`

That way Shopify and the post-purchase extension continue to use the stable
Cloudflare URL, not the Render hostname directly.

## After Render is live

Once Render gives you a live hostname such as:

- `https://post-purchase-app.onrender.com`

set this in Cloudflare Worker variables:

- `APP_ORIGIN=https://post-purchase-app.onrender.com`

Do not point `APP_ORIGIN` at the Cloudflare `workers.dev` URL.

## Expected result

- Render hosts the actual Shopify app
- Cloudflare proxies `post-purchase.benjmeyer02.workers.dev` to Render
- Shopify continues to use the Cloudflare URL as the app's canonical public URL
