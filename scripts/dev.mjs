import { createRequire } from "node:module";
import { loadLocalEnv, applyLocalDatabaseDefaults } from "./load-local-env.mjs";
import {
  getRequiredPublicAppUrl,
  resolvePublicAppUrl,
} from "../app/config.server.js";

loadLocalEnv();
applyLocalDatabaseDefaults();

const resolution = resolvePublicAppUrl();
const appUrl = getRequiredPublicAppUrl("dev web startup");

process.env.SHOPIFY_APP_URL = appUrl;
process.env.EFFECTIVE_PUBLIC_APP_URL = appUrl;
process.env.EFFECTIVE_PUBLIC_APP_URL_SOURCE = resolution.source || "";

console.log(
  `[public-app-url] resolved ${appUrl} from ${resolution.source || "unknown"}`
);

await import("./sync-app-url.mjs");

const require = createRequire(import.meta.url);
const { createRequestHandler } = require("@remix-run/express");
const express = require("express");

const app = express();
const BUILD_PATH = process.env.BUILD_PATH || "./build/index.js";
const BUILD_DIR = BUILD_PATH.replace(/\/index\.js$/, "");

app.use(
  "/build",
  express.static(`${BUILD_DIR}/client/build`, { immutable: true, maxAge: "1y" })
);
app.use(express.static("public", { maxAge: "1h" }));
app.use(
  createRequestHandler({
    build: await import(BUILD_PATH),
    mode: process.env.NODE_ENV,
  })
);

const port = Number.parseInt(process.env.PORT || "3000", 10);

app.listen(port, () => {
  console.log(`app listening on ${port}`);
});
